// src/components/charts/DailyAppUsagePieChart.jsx
import React, { useMemo } from 'react';
import { Pie } from 'react-chartjs-2';

function DailyAppUsagePieChart({ dailyAppStats, options, getPaletteColor }) { // UPDATED PROP
    const chartData = useMemo(() => {
        if (!dailyAppStats || dailyAppStats.length === 0) {
            return { labels: [], datasets: [] };
        }

        const sortedStats = [...dailyAppStats].sort((a, b) => (b.totalTime || 0) - (a.totalTime || 0));

        const labels = [];
        const data = [];
        const backgroundColors = [];
        const maxAppsToShow = 8;
        let otherTime = 0;

        sortedStats.forEach((stat, index) => { // <-- Added index
            const appName = (stat.appName || 'Unknown').replace(/_/g, '.');
            const timeInMinutes = Math.round((stat.totalTime || 0) / 60);

            if (timeInMinutes >= 1) {
                if (labels.length < maxAppsToShow) {
                    labels.push(appName);
                    data.push(timeInMinutes);
                    backgroundColors.push(getPaletteColor(index)); // <-- USE NEW PROP
                } else {
                    otherTime += timeInMinutes;
                }
            }
        });

        if (otherTime > 0) {
            labels.push('Other');
            data.push(otherTime);
            backgroundColors.push('#cccccc');
        }

        if (labels.length === 0) return { labels: [], datasets: [] };

        return {
            labels: labels,
            datasets: [{
                label: 'Total Time (Minutes)',
                data: data,
                backgroundColor: backgroundColors,
                borderColor: '#fff',
                borderWidth: 1,
            }],
        };
    }, [dailyAppStats, getPaletteColor]); // UPDATED dependency array

    const hasData = chartData.labels.length > 0;

    return (
        <div style={styles.container}>
            <h3 style={styles.title}>Daily App Usage Distribution</h3>
            <div style={{ ...styles.chartWrapper, height: '280px' }}>
                {hasData ? (
                    <Pie options={options} data={chartData} />
                ) : (
                    <p style={styles.noDataText}>No significant app usage (`{'>'}`= 1 min).</p>
                )}
            </div>
        </div>
    );
}
// Keep your styles object here
const styles = { /* ... container, title, chartWrapper, noDataText styles ... */ };
export default DailyAppUsagePieChart;