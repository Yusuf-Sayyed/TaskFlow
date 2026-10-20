import React, { useState, useEffect, useRef } from 'react';
import { Search, X } from 'lucide-react';
import { useDebounce } from '../../hooks/useDebounce';

export function SearchInput({ value = '', onChange, placeholder = 'Search...', className = '' }) {
  const [internalVal, setInternalVal] = useState(value);
  const debouncedVal = useDebounce(internalVal, 350);
  const onChangeRef = useRef(onChange);
  onChangeRef.current = onChange;

  // Sync internal state if parent value changed externally
  useEffect(() => {
    setInternalVal(value || '');
  }, [value]);

  // Trigger parent onChange only when debounced value differs from prop
  useEffect(() => {
    if (debouncedVal !== value && onChangeRef.current) {
      onChangeRef.current(debouncedVal);
    }
  }, [debouncedVal, value]);

  const handleClear = () => {
    setInternalVal('');
    if (onChangeRef.current) {
      onChangeRef.current('');
    }
  };

  return (
    <div className={`relative flex items-center ${className}`}>
      <Search className="w-4 h-4 text-slate-400 absolute left-3.5 pointer-events-none" />
      <input
        type="text"
        value={internalVal}
        onChange={(e) => setInternalVal(e.target.value)}
        placeholder={placeholder}
        className="w-full pl-10 pr-9 py-2 bg-white border border-slate-200 rounded-xl text-sm placeholder-slate-400 text-slate-800 focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 transition-all shadow-sm"
      />
      {internalVal && (
        <button
          type="button"
          onClick={handleClear}
          className="absolute right-3 p-0.5 rounded-full text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors"
        >
          <X className="w-3.5 h-3.5" />
        </button>
      )}
    </div>
  );
}
