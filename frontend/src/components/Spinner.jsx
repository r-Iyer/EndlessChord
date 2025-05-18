import React from 'react';

function Spinner() {
  return (
    <div className="flex flex-col items-center">
      <svg className="animate-spin h-12 w-12 text-purple-500 mb-2" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z"></path>
      </svg>
      <span className="text-lg text-white">Loading...</span>
    </div>
  );
}

export default Spinner;
