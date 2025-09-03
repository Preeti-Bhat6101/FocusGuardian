import React, { useMemo } from 'react';
import { Pie } from 'react-chartjs-2';

// NOTE: We removed the PREDEFINED_COLORS from here. It now comes from the utils file.

function AppUsagePieChart({ sessionData, getPaletteColor }) { // Receive getPaletteColor as a prop
    const chartData = useMemo(() => {
        if (!sessionData || !sessionData.appUsage || Object.keys(sessionData.appUsage).length === 0) {
            return { labels: [], datasets: [] };
        }

        const appEntries = Object.entries(sessionData.appUsage);
        appEntries.sort(([, timeA], [, timeB]) => timeB - timeA);

        const labels = [];
        const data = [];
        const backgroundColors = [];
        const maxAppsToShow = 10;
        let otherTime = 0;

        appEntries.forEach(([appName, time], index) => { // <-- index is important here
             const timeInMinutes = Math.round(time / 60);
             if (timeInMinutes >= 1) {
                 if (labels.length < maxAppsToShow) {
                    labels.push(appName.replace(/_/g, '.'));
                    data.push(timeInMinutes);
                    // Use the new stable color function
                    backgroundColors.push(getPaletteColor(index)); 
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
                label: 'Time Spent (Minutes)',
                data: data,
                backgroundColor: backgroundColors,
                borderColor: '#fff',
                borderWidth: 2,
                hoverOffset: 4
            }],
        };
    }, [sessionData, getPaletteColor]); // Dependency array updated

    const options = {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
            legend: {
                position: 'bottom',
                labels: {
                    font: {
                        family: '"Helvetica Neue", "Helvetica", "Arial", sans-serif',
                        size: 14,
                    },
                    color: '#333',
                    padding: 20
                }
            },
            tooltip: {
                backgroundColor: 'rgba(0, 0, 0, 0.7)',
                titleFont: { size: 16 },
                bodyFont: { size: 14 },
                callbacks: {
                    label: function(context) {
                        let label = context.label || '';
                        if (label) {
                            label += ': ';
                        }
                        if (context.parsed !== null) {
                            label += context.parsed + ' minutes';
                        }
                        return label;
                    }
                }
            }
        },
        animation: {
            animateScale: true,
            animateRotate: true
        }
    };

    const hasData = chartData.labels.length > 0;

    return (
        <div style={{ position: 'relative', height: '400px' }}>
            {hasData ? (
                <Pie options={options} data={chartData} />
            ) : (
                <p style={{ textAlign: 'center', color: '#666' }}>No significant app usage (`{'>'}`= 1 min).</p>
            )}
        </div>
    );
}

export default AppUsagePieChart;