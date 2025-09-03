// src/components/charts/DailyFocusTimeChart.jsx
import React, { useMemo } from 'react';
import { Bar } from 'react-chartjs-2';

// The dataStyler is a function that will be passed in to style the data
function DailyFocusTimeChart({ dailyData, options, formatDateShort, dataStyler }) {
    const chartData = useMemo(() => {
        if (!dailyData || dailyData.length === 0) return { labels: [], datasets: [] };
        
        const baseData = {
            labels: dailyData.map(d => formatDateShort(d.date)),
            datasets: [{
                label: 'Focus Time (Minutes)',
                data: dailyData.map(d => Math.round((d.focusTime || 0) / 60)),
                // REMOVED backgroundColor, borderColor, etc. The styler will handle this.
            }]
        };

        // If a styler function is provided, use it to transform the data
        if (dataStyler) {
            return dataStyler(baseData);
        }

        return baseData; // Fallback to unstyled data if no styler is passed
    }, [dailyData, formatDateShort, dataStyler]);

    const hasData = chartData.labels.length > 0;

    return (
        <div style={styles.container}>
            <h3 style={styles.title}>Daily Focus Time</h3>
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

const styles = { /* ... keep your styles ... */ };

export default DailyFocusTimeChart;