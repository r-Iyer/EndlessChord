import './Spinner.css';

function Spinner() {
  return (
    <div className="spinner-container">
      <svg className="spinner-svg" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
        <circle className="spinner-circle" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
        <path className="spinner-path" fill="currentColor" d="M4 12a8 8 0 018-8v8z"></path>
      </svg>
      <span className="spinner-text">Loading...</span>
    </div>
  );
}

export default Spinner;