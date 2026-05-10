import { useState, useRef } from 'react';
import './NumberPicker.css';

function NumberPicker({ value, onChange, onClose, label }) {
  const [input, setInput] = useState(value?.toString() || '');
  const inputRef = useRef(null);

  const handleNumberClick = (num) => {
    setInput(prev => prev + num);
  };

  const handleDecimal = () => {
    if (!input.includes('.')) {
      setInput(prev => prev || '0' + '.');
    }
  };

  const handleBackspace = () => {
    setInput(prev => prev.slice(0, -1));
  };

  const handleClear = () => {
    setInput('');
  };

  const handleConfirm = () => {
    onChange(input ? parseFloat(input) : '');
    onClose();
  };

  return (
    <div className="number-picker-overlay" onClick={onClose}>
      <div className="number-picker" onClick={e => e.stopPropagation()}>
        <div className="picker-header">
          <h3>{label}</h3>
          <button className="close-btn" onClick={onClose}>✕</button>
        </div>

        <div className="picker-display">
          <input
            ref={inputRef}
            type="text"
            value={input}
            onChange={e => setInput(e.target.value)}
            placeholder="0"
            className="picker-input"
          />
        </div>

        <div className="number-pad">
          <div className="pad-row">
            <button onClick={() => handleNumberClick('7')}>7</button>
            <button onClick={() => handleNumberClick('8')}>8</button>
            <button onClick={() => handleNumberClick('9')}>9</button>
            <button onClick={handleBackspace} className="action-btn">← DEL</button>
          </div>
          <div className="pad-row">
            <button onClick={() => handleNumberClick('4')}>4</button>
            <button onClick={() => handleNumberClick('5')}>5</button>
            <button onClick={() => handleNumberClick('6')}>6</button>
            <button onClick={handleClear} className="action-btn">CLR</button>
          </div>
          <div className="pad-row">
            <button onClick={() => handleNumberClick('1')}>1</button>
            <button onClick={() => handleNumberClick('2')}>2</button>
            <button onClick={() => handleNumberClick('3')}>3</button>
            <button onClick={handleDecimal} className="action-btn">.</button>
          </div>
          <div className="pad-row">
            <button onClick={() => handleNumberClick('0')} className="zero-btn">0</button>
            <button onClick={handleConfirm} className="confirm-btn">✓ OK</button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default NumberPicker;
