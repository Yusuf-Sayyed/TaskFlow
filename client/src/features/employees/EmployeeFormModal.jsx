import React, { useState, useEffect } from 'react';
import { Modal } from '../../components/common/Modal';
import { useToast } from '../../components/common/ToastContext';
import apiClient from '../../api/client';
import {
  DEPARTMENTS,
  EMPLOYEE_STATUSES,
  toInputDateFormat,
  COUNTRY_OPTIONS,
  formatPhoneNumber,
} from '../../utils/formatters';
import { AlertCircle, Plus, X } from 'lucide-react';

export function EmployeeFormModal({ isOpen, onClose, employee = null, onSaved }) {
  const { success, error: toastError } = useToast();
  const isEditing = Boolean(employee);

  const [selectedCountryCode, setSelectedCountryCode] = useState('+1');
  const [phoneDigits, setPhoneDigits] = useState('');

  const activeCountry =
    COUNTRY_OPTIONS.find((c) => c.code === selectedCountryCode) || COUNTRY_OPTIONS[0];

  const [formData, setFormData] = useState({
    fullName: '',
    email: '',
    department: 'Development',
    role: '',
    joiningDate: toInputDateFormat(new Date()),
    status: 'Active',
    skills: '',
    leaveStartDate: '',
    leaveEndDate: '',
  });

  const [formErrors, setFormErrors] = useState({});
  const [submitting, setSubmitting] = useState(false);
  const [serverError, setServerError] = useState(null);

  useEffect(() => {
    if (employee) {
      // Parse existing phone if available
      let detectedCode = '+1';
      let extractedDigits = '';

      if (employee.phone) {
        const cleaned = employee.phone.trim();
        // Check for matching country code (sort desc by code length to match +971 before +9)
        const sorted = [...COUNTRY_OPTIONS].sort((a, b) => b.code.length - a.code.length);
        const match = sorted.find((c) => cleaned.startsWith(c.code));
        if (match) {
          detectedCode = match.code;
          extractedDigits = cleaned.slice(match.code.length).replace(/\D/g, '').slice(0, match.maxDigits);
        } else {
          extractedDigits = cleaned.replace(/\D/g, '').slice(0, 10);
        }
      }

      setSelectedCountryCode(detectedCode);
      setPhoneDigits(extractedDigits);

      setFormData({
        fullName: employee.fullName || '',
        email: employee.email || '',
        department: employee.department || 'Development',
        role: employee.role || '',
        joiningDate: toInputDateFormat(employee.joiningDate),
        status: employee.status || 'Active',
        skills: Array.isArray(employee.skills) ? employee.skills.join(', ') : '',
        leaveStartDate: toInputDateFormat(employee.leaveStartDate),
        leaveEndDate: toInputDateFormat(employee.leaveEndDate),
      });
    } else {
      setSelectedCountryCode('+1');
      setPhoneDigits('');
      setFormData({
        fullName: '',
        email: '',
        department: 'Development',
        role: '',
        joiningDate: toInputDateFormat(new Date()),
        status: 'Active',
        skills: '',
        leaveStartDate: '',
        leaveEndDate: '',
      });
    }
    setFormErrors({});
    setServerError(null);
  }, [employee, isOpen]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    if (formErrors[name]) {
      setFormErrors((prev) => ({ ...prev, [name]: null }));
    }
    if (serverError) setServerError(null);
  };

  const handlePhoneChange = (e) => {
    const rawInput = e.target.value;
    // Strip all non-digit characters
    const digitsOnly = rawInput.replace(/\D/g, '');
    // Strictly cap at maxDigits for selected country so users cannot type unlimited numbers
    const limitedDigits = digitsOnly.slice(0, activeCountry.maxDigits);
    setPhoneDigits(limitedDigits);
    if (formErrors.phone) {
      setFormErrors((prev) => ({ ...prev, phone: null }));
    }
    if (serverError) setServerError(null);
  };

  const handleCountryChange = (e) => {
    const newCode = e.target.value;
    setSelectedCountryCode(newCode);
    const newCountry = COUNTRY_OPTIONS.find((c) => c.code === newCode) || COUNTRY_OPTIONS[0];
    // Trim digits if new country has a lower max limit
    setPhoneDigits((prev) => prev.slice(0, newCountry.maxDigits));
    if (formErrors.phone) {
      setFormErrors((prev) => ({ ...prev, phone: null }));
    }
    if (serverError) setServerError(null);
  };

  const validate = () => {
    const errors = {};
    if (!formData.fullName.trim()) errors.fullName = 'Full name is required';
    if (!formData.email.trim()) {
      errors.email = 'Email address is required';
    } else if (!/^\S+@\S+\.\S+$/.test(formData.email.trim())) {
      errors.email = 'Please provide a valid email format';
    }
    if (!formData.role.trim()) errors.role = 'Role is required';
    if (!formData.joiningDate) errors.joiningDate = 'Joining date is required';

    if (phoneDigits) {
      const minRequired = Math.max(7, activeCountry.maxDigits - 2);
      if (phoneDigits.length < minRequired) {
        errors.phone = `Phone number must be at least ${minRequired} digits for ${activeCountry.name}`;
      }
    }

    if (formData.status === 'On Leave') {
      if (!formData.leaveStartDate) {
        errors.leaveStartDate = 'Leave start date is required when employee is On Leave';
      }
      if (!formData.leaveEndDate) {
        errors.leaveEndDate = 'Leave end date is required when employee is On Leave';
      }
      if (formData.leaveStartDate && formData.leaveEndDate && formData.leaveEndDate < formData.leaveStartDate) {
        errors.leaveEndDate = 'Leave end date cannot precede start date';
      }
    }

    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validate()) return;

    setSubmitting(true);
    setServerError(null);

    const parsedSkills = formData.skills
      ? formData.skills.split(',').map((s) => s.trim()).filter(Boolean)
      : [];

    let finalPhone = '';
    if (phoneDigits) {
      const formatted = formatPhoneNumber(phoneDigits, activeCountry.format);
      finalPhone = `${activeCountry.code} ${formatted}`;
    }

    const payload = {
      fullName: formData.fullName.trim(),
      email: formData.email.trim().toLowerCase(),
      phone: finalPhone,
      department: formData.department,
      role: formData.role.trim(),
      joiningDate: formData.joiningDate,
      status: formData.status,
      skills: parsedSkills,
      ...(formData.status === 'On Leave'
        ? {
            leaveStartDate: formData.leaveStartDate,
            leaveEndDate: formData.leaveEndDate,
          }
        : {
            leaveStartDate: null,
            leaveEndDate: null,
          }),
    };

    try {
      if (isEditing) {
        await apiClient.put(`/employees/${employee._id}`, payload);
        success(`Employee ${payload.fullName} updated successfully!`);
      } else {
        await apiClient.post('/employees', payload);
        success(`Employee ${payload.fullName} added successfully!`);
      }
      onSaved();
      onClose();
    } catch (err) {
      setServerError(err.message);
      toastError(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={isEditing ? `Edit Employee (${employee.employeeId})` : 'Add New Employee'}
      maxWidth="max-w-2xl"
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        {serverError && (
          <div className="p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-sm flex items-start space-x-2.5">
            <AlertCircle className="w-4 h-4 text-rose-600 flex-shrink-0 mt-0.5" />
            <div className="flex-1 font-medium">{serverError}</div>
          </div>
        )}

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {/* Full Name */}
          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
              Full Name <span className="text-rose-500">*</span>
            </label>
            <input
              type="text"
              name="fullName"
              value={formData.fullName}
              onChange={handleChange}
              placeholder="e.g. Sarah Jenkins"
              className={`w-full px-3.5 py-2 rounded-xl border text-sm focus:outline-none focus:ring-2 transition-all ${
                formErrors.fullName
                  ? 'border-rose-300 focus:ring-rose-200 bg-rose-50/30'
                  : 'border-slate-200 focus:ring-brand-500/20 focus:border-brand-500'
              }`}
            />
            {formErrors.fullName && (
              <p className="text-xs text-rose-600 mt-1 font-medium">{formErrors.fullName}</p>
            )}
          </div>

          {/* Email */}
          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
              Email Address <span className="text-rose-500">*</span>
            </label>
            <input
              type="email"
              name="email"
              value={formData.email}
              onChange={handleChange}
              placeholder="e.g. sarah.jenkins@company.com"
              className={`w-full px-3.5 py-2 rounded-xl border text-sm focus:outline-none focus:ring-2 transition-all ${
                formErrors.email
                  ? 'border-rose-300 focus:ring-rose-200 bg-rose-50/30'
                  : 'border-slate-200 focus:ring-brand-500/20 focus:border-brand-500'
              }`}
            />
            {formErrors.email && (
              <p className="text-xs text-rose-600 mt-1 font-medium">{formErrors.email}</p>
            )}
          </div>

          {/* Phone with Country Code and Formatting */}
          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
              Phone Number
            </label>
            <div
              className={`flex rounded-xl border overflow-hidden transition-all bg-white shadow-2xs ${
                formErrors.phone
                  ? 'border-rose-300 ring-2 ring-rose-200'
                  : 'border-slate-200 focus-within:ring-2 focus-within:ring-brand-500/20 focus-within:border-brand-500'
              }`}
            >
              {/* Country Code with Country Name */}
              <select
                value={selectedCountryCode}
                onChange={handleCountryChange}
                className="bg-slate-50 text-slate-800 text-xs font-semibold px-2.5 py-2 border-r border-slate-200 focus:outline-none cursor-pointer hover:bg-slate-100 transition-colors max-w-[150px] sm:max-w-[195px] truncate"
                title="Select country code"
              >
                {COUNTRY_OPTIONS.map((c) => (
                  <option key={`${c.shortName}-${c.code}`} value={c.code}>
                    {c.name}
                  </option>
                ))}
              </select>

              {/* Formatted Phone Input */}
              <input
                type="tel"
                value={formatPhoneNumber(phoneDigits, activeCountry.format)}
                onChange={handlePhoneChange}
                placeholder={activeCountry.format.replace(/X/g, '0')}
                className="w-full px-3.5 py-2 text-sm text-slate-900 bg-white focus:outline-none placeholder-slate-400 font-mono tracking-wider"
              />
            </div>
            {formErrors.phone && (
              <p className="text-xs text-rose-600 mt-1 font-medium">{formErrors.phone}</p>
            )}
            <div className="flex items-center justify-between text-[11px] text-slate-400 mt-1">
              <span>
                Format: <span className="font-mono text-slate-600 font-semibold">{activeCountry.code} {activeCountry.format}</span>
              </span>
              <span className={`font-mono text-xs ${phoneDigits.length === activeCountry.maxDigits ? 'text-emerald-600 font-bold' : 'text-slate-400'}`}>
                {phoneDigits.length} / {activeCountry.maxDigits} digits
              </span>
            </div>
          </div>

          {/* Department */}
          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
              Department <span className="text-rose-500">*</span>
            </label>
            <select
              name="department"
              value={formData.department}
              onChange={handleChange}
              className="w-full px-3.5 py-2 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 bg-white transition-all"
            >
              {DEPARTMENTS.map((dept) => (
                <option key={dept} value={dept}>
                  {dept}
                </option>
              ))}
            </select>
          </div>

          {/* Role */}
          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
              Job Role / Title <span className="text-rose-500">*</span>
            </label>
            <input
              type="text"
              name="role"
              value={formData.role}
              onChange={handleChange}
              placeholder="e.g. Senior Frontend Engineer"
              className={`w-full px-3.5 py-2 rounded-xl border text-sm focus:outline-none focus:ring-2 transition-all ${
                formErrors.role
                  ? 'border-rose-300 focus:ring-rose-200 bg-rose-50/30'
                  : 'border-slate-200 focus:ring-brand-500/20 focus:border-brand-500'
              }`}
            />
            {formErrors.role && (
              <p className="text-xs text-rose-600 mt-1 font-medium">{formErrors.role}</p>
            )}
          </div>

          {/* Joining Date */}
          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
              Joining Date <span className="text-rose-500">*</span>
            </label>
            <input
              type="date"
              name="joiningDate"
              value={formData.joiningDate}
              onChange={handleChange}
              className={`w-full px-3.5 py-2 rounded-xl border text-sm focus:outline-none focus:ring-2 transition-all ${
                formErrors.joiningDate
                  ? 'border-rose-300 focus:ring-rose-200 bg-rose-50/30'
                  : 'border-slate-200 focus:ring-brand-500/20 focus:border-brand-500'
              }`}
            />
            {formErrors.joiningDate && (
              <p className="text-xs text-rose-600 mt-1 font-medium">{formErrors.joiningDate}</p>
            )}
          </div>

          {/* Status */}
          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
              Employment Status <span className="text-rose-500">*</span>
            </label>
            <select
              name="status"
              value={formData.status}
              onChange={handleChange}
              className="w-full px-3.5 py-2 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 bg-white transition-all font-medium"
            >
              {EMPLOYEE_STATUSES.map((st) => (
                <option key={st} value={st}>
                  {st}
                </option>
              ))}
            </select>
          </div>

          {/* Skills */}
          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
              Skills (Comma Separated)
            </label>
            <input
              type="text"
              name="skills"
              value={formData.skills}
              onChange={handleChange}
              placeholder="e.g. React, Node.js, TypeScript"
              className="w-full px-3.5 py-2 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 transition-all"
            />
          </div>
        </div>

        {/* Conditional Leave Dates when On Leave */}
        {formData.status === 'On Leave' && (
          <div className="p-4 rounded-2xl bg-amber-50/80 border border-amber-200 space-y-3 animate-fadeIn">
            <h4 className="text-xs font-bold text-amber-900 uppercase tracking-wider">
              Leave Duration Validation
            </h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-amber-800 mb-1">
                  Leave Start Date <span className="text-rose-500">*</span>
                </label>
                <input
                  type="date"
                  name="leaveStartDate"
                  value={formData.leaveStartDate}
                  onChange={handleChange}
                  className={`w-full px-3.5 py-2 rounded-xl border text-sm bg-white focus:outline-none focus:ring-2 ${
                    formErrors.leaveStartDate
                      ? 'border-rose-400 focus:ring-rose-200'
                      : 'border-amber-200 focus:ring-amber-500/20 focus:border-amber-500'
                  }`}
                />
                {formErrors.leaveStartDate && (
                  <p className="text-xs text-rose-600 mt-1 font-medium">{formErrors.leaveStartDate}</p>
                )}
              </div>

              <div>
                <label className="block text-xs font-bold text-amber-800 mb-1">
                  Leave End Date <span className="text-rose-500">*</span>
                </label>
                <input
                  type="date"
                  name="leaveEndDate"
                  value={formData.leaveEndDate}
                  onChange={handleChange}
                  className={`w-full px-3.5 py-2 rounded-xl border text-sm bg-white focus:outline-none focus:ring-2 ${
                    formErrors.leaveEndDate
                      ? 'border-rose-400 focus:ring-rose-200'
                      : 'border-amber-200 focus:ring-amber-500/20 focus:border-amber-500'
                  }`}
                />
                {formErrors.leaveEndDate && (
                  <p className="text-xs text-rose-600 mt-1 font-medium">{formErrors.leaveEndDate}</p>
                )}
              </div>
            </div>
            <p className="text-[11px] text-amber-700">
              * Active task assignments scheduled within this inclusive date range will be blocked by system rules.
            </p>
          </div>
        )}

        {/* Buttons */}
        <div className="pt-4 border-t border-slate-100 flex items-center justify-end space-x-3">
          <button
            type="button"
            onClick={onClose}
            disabled={submitting}
            className="px-4 py-2 text-sm font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-xl transition-colors disabled:opacity-50"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={submitting}
            className="px-5 py-2 text-sm font-bold text-white bg-indigo-600 hover:bg-indigo-700 rounded-xl shadow-sm transition-all disabled:opacity-50 cursor-pointer"
          >
            {submitting ? 'Saving Employee...' : isEditing ? 'Save Changes' : 'Create Employee'}
          </button>
        </div>
      </form>
    </Modal>
  );
}
