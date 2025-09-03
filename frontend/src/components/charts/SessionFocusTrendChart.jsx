import React, { useMemo } from 'react';
import { Line } from 'react-chartjs-2';

function SessionFocusTrendChart({ history, options, dataStyler }) { // Add dataStyler prop
    const chartData = useMemo(() => {
        if (!history || history.length === 0) return { labels: [], datasets: [] };

        const validHistory = history.filter(s => s.startTime).reverse();

        // 1. Define the raw data structure
        const baseData = {
            labels: validHistory.map(s => new Date(s.startTime).toLocaleString(undefined, { month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' })),
            datasets: [{
                label: 'Focus % per Session',
                data: validHistory.map(s => {
                   const total = (s.focusTime || 0) + (s.distractionTime || 0);
                   return total === 0 ? 0 : Math.round(((s.focusTime || 0) / total) * 100);
                }),
                // Styling properties (borderColor, backgroundColor, tension, fill) are removed
            }]
        };

        // 2. Apply the styler if it exists
        if (dataStyler) {
            return dataStyler(baseData);
        }

        return baseData;
    }, [history, dataStyler]); // 3. Add dataStyler to dependency array

     const hasData = chartData.labels.length > 0;

    return (
         <div style={styles.container}>
             <h3 style={styles.title}>Focus % Per Session</h3>
             <div style={{ ...styles.chartWrapper, height: '280px' }}>
                 {hasData ? (
                     <Line options={options} data={chartData} />
                 ) : (
                     <p style={styles.noDataText}>No data available.</p>
                 )}
             </div>
         </div>
     );
}

const styles = {
    container: {},
    title: { textAlign: 'center' },
    chartWrapper: { position: 'relative' },
    noDataText: { textAlign: 'center', color: '#666' }
};

export default SessionFocusTrendChart;