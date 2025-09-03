import React, { useMemo } from 'react';
import { Bar } from 'react-chartjs-2';

// The dataStyler is a function passed in to apply consistent, advanced styling
function DailyFocusPercentChart({ dailyData, options, formatDateShort, dataStyler }) {
    const chartData = useMemo(() => {
        if (!dailyData || dailyData.length === 0) return { labels: [], datasets: [] };

        // 1. Define the raw data structure without any styling
        const baseData = {
            labels: dailyData.map(d => formatDateShort(d.date)),
            datasets: [{
                label: 'Focus Percentage (%)',
                data: dailyData.map(d => d.focusPercentage || 0),
                // Styling properties (backgroundColor, borderColor, etc.) are now removed from here
            }]
        };

        // 2. If a styler function is provided, use it to transform the data
        if (dataStyler) {
            return dataStyler(baseData);
        }

        return baseData; // Fallback to unstyled data if no styler is passed
    }, [dailyData, formatDateShort, dataStyler]); // 3. Add dataStyler to dependency array

    const hasData = chartData.labels.length > 0;

    return (
        <div style={styles.container}>
             <h3 style={styles.title}>Daily Focus Percentage</h3>
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

export default DailyFocusPercentChart;