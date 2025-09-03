import React, { useMemo } from 'react';
import { Bar } from 'react-chartjs-2';

function SessionDurationChart({ history, options, dataStyler }) { // Add dataStyler prop
    const chartData = useMemo(() => {
        if (!history || history.length === 0) return { labels: [], datasets: [] };
        
        const validHistory = history.filter(s => s.startTime && s.endTime).reverse();

        // 1. Define the raw data structure
        const baseData = {
            labels: validHistory.map(s => new Date(s.startTime).toLocaleString(undefined, { month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' })),
            datasets: [{
                label: 'Session Duration (Minutes)',
                data: validHistory.map(s => Math.round((new Date(s.endTime).getTime() - new Date(s.startTime).getTime()) / 60000)),
                // Styling properties are removed
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
             <h3 style={styles.title}>Session Duration</h3>
             <div style={{ ...styles.chartWrapper, height: '280px' }}>
                 {hasData ? (
                     <Bar options={options} data={chartData} />
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

export default SessionDurationChart;