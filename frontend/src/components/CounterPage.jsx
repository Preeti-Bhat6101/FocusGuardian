import React, { useState, useEffect, useRef } from 'react';
import './CounterPage.css';

const formatTime = (totalSeconds) => {
    const h = String(Math.floor(totalSeconds / 3600)).padStart(2, '0');
    const m = String(Math.floor((totalSeconds % 3600) / 60)).padStart(2, '0');
    const s = String(totalSeconds % 60).padStart(2, '0');
    return `${h}:${m}:${s}`;
};

function CounterPage() {
    const [elapsedSeconds, setElapsedSeconds] = useState(0);

    useEffect(() => {
        const interval = setInterval(() => {
            setElapsedSeconds(prev => prev + 1);
        }, 1000);
        return () => clearInterval(interval); // Cleanup when window closes
    }, []);

    return (
        <div className="counter-container">
            <span className="label">Session Active</span>
            <span className="time">{formatTime(elapsedSeconds)}</span>
        </div>
    );
}

export default CounterPage;