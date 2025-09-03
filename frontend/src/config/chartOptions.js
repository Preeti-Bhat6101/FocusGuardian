// src/config/chartOptions.js
import { PREDEFINED_COLORS } from '../utils/formatters';

// --- Base Theme Colors ---
const FONT_FAMILY = "'Poppins', sans-serif";
const TEXT_COLOR = '#2D4357';
const GRID_COLOR = 'rgba(45, 67, 87, 0.1)';
const TOOLTIP_BG = 'rgba(255, 255, 255, 0.95)';
const TOOLTIP_BORDER = 'rgba(45, 67, 87, 0.2)';

// --- Base Options for ALL charts ---
const baseOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
        legend: {
            labels: {
                color: TEXT_COLOR,
                font: {
                    family: FONT_FAMILY,
                    size: 13,
                },
                boxWidth: 12,
                padding: 20,
            },
        },
        tooltip: {
            enabled: true,
            backgroundColor: TOOLTIP_BG,
            titleColor: TEXT_COLOR,
            bodyColor: TEXT_COLOR,
            borderColor: TOOLTIP_BORDER,
            borderWidth: 1,
            cornerRadius: 8,
            padding: 12,
            displayColors: true,
            boxPadding: 4,
            titleFont: { family: FONT_FAMILY, size: 14, weight: 'bold' },
            bodyFont: { family: FONT_FAMILY, size: 12 },
        },
    },
    animation: {
        duration: 800,
        easing: 'easeInOutQuart',
    },
};

// --- Specific Chart Configurations ---

/**
 * Creates stylish options for Bar Charts.
 * @param {boolean} isPercent - If true, sets the Y-axis max to 100.
 */
export const getBarChartOptions = (isPercent = false) => ({
    ...baseOptions,
    plugins: {
        ...baseOptions.plugins,
        legend: {
            ...baseOptions.plugins.legend,
            position: 'top',
            align: 'end',
        },
    },
    scales: {
        x: {
            grid: {
                display: false,
            },
            ticks: {
                color: TEXT_COLOR,
                font: { family: FONT_FAMILY },
            },
        },
        y: {
            beginAtZero: true,
            ...(isPercent && { min: 0, max: 100 }), // Conditionally add max for percentages
            grid: {
                color: GRID_COLOR,
                drawBorder: false,
            },
            ticks: {
                color: TEXT_COLOR,
                font: { family: FONT_FAMILY },
                padding: 10,
            },
        },
    },
});

/**
 * Creates stylish options for Line Charts.
 * @param {boolean} isPercent - If true, sets the Y-axis max to 100.
 */
export const getLineChartOptions = (isPercent = false) => ({
    ...baseOptions,
    plugins: {
        ...baseOptions.plugins,
        legend: {
            ...baseOptions.plugins.legend,
            position: 'top',
            align: 'end',
        },
    },
    scales: {
        x: {
            grid: {
                display: false,
            },
            ticks: {
                color: TEXT_COLOR,
                font: { family: FONT_FAMILY },
                maxRotation: 0,
                autoSkip: true,
                maxTicksLimit: 7,
            },
        },
        y: {
            beginAtZero: true,
            ...(isPercent && { min: 0, max: 100 }),
            grid: {
                color: GRID_COLOR,
                drawBorder: false,
            },
            ticks: {
                color: TEXT_COLOR,
                font: { family: FONT_FAMILY },
                padding: 10,
            },
        },
    },
    elements: {
        line: {
            tension: 0.4, // Creates smooth, curved lines
            borderWidth: 3,
        },
        point: {
            radius: 4,
            backgroundColor: '#fff',
            hoverRadius: 7,
            hitRadius: 20,
        },
    },
});

/**
 * Creates stylish options for Pie Charts.
 */
export const getPieChartOptions = () => ({
    ...baseOptions,
    plugins: {
        ...baseOptions.plugins,
        legend: {
            ...baseOptions.plugins.legend,
            position: 'right', // More modern placement for pie charts
        },
        tooltip: {
            ...baseOptions.plugins.tooltip,
            callbacks: {
                label: (context) => {
                    const label = context.label || '';
                    const value = context.parsed || 0;
                    return ` ${label}: ${value} min`;
                },
            },
        },
    },
});

// --- Chart Data Stylers ---

/**
 * Applies a beautiful gradient to a bar chart dataset.
 * @param {CanvasRenderingContext2D} context - The chart context.
 * @param {string} color - The base color from our palette.
 */
const createGradient = (context, color) => {
    if (!context || !context.chart || !context.chart.ctx || !context.chart.chartArea) {
        return color; // Fallback if context is not ready
    }
    const chart = context.chart;
    const { ctx, chartArea } = chart;
    const gradient = ctx.createLinearGradient(0, chartArea.bottom, 0, chartArea.top);
    
    // Use tinycolor2 or a similar library for more advanced color manipulation,
    // but for now, we can hardcode a lighter version.
    const lightColor = color + 'B3'; // Add some transparency
    const veryLightColor = color + '33'; // Add more transparency

    gradient.addColorStop(0, lightColor);
    gradient.addColorStop(1, veryLightColor);
    return gradient;
};

/**
 * Styles the dataset for DailyFocusTimeChart with a gradient.
 */
export const styleDailyFocusTime = (data) => ({
    ...data,
    datasets: data.datasets.map(ds => ({
        ...ds,
        backgroundColor: (context) => createGradient(context, PREDEFINED_COLORS[1]), // Green
        borderColor: PREDEFINED_COLORS[1],
        borderRadius: 6,
        borderWidth: 2,
    })),
});

/**
 * Styles the dataset for DailyFocusPercentChart with a gradient.
 */
export const styleDailyFocusPercent = (data) => ({
    ...data,
    datasets: data.datasets.map(ds => ({
        ...ds,
        backgroundColor: (context) => createGradient(context, PREDEFINED_COLORS[0]), // Blue
        borderColor: PREDEFINED_COLORS[0],
        borderRadius: 6,
        borderWidth: 2,
    })),
});

/**
 * Styles the dataset for SessionDurationChart with a gradient.
 */
export const styleSessionDuration = (data) => ({
    ...data,
    datasets: data.datasets.map(ds => ({
        ...ds,
        backgroundColor: (context) => createGradient(context, PREDEFINED_COLORS[2]), // Teal
        borderColor: PREDEFINED_COLORS[2],
        borderRadius: 6,
        borderWidth: 2,
    })),
});

/**
 * Styles the dataset for SessionFocusTrendChart with a gradient fill.
 */
export const styleSessionFocusTrend = (data) => ({
    ...data,
    datasets: data.datasets.map(ds => ({
        ...ds,
        borderColor: PREDEFINED_COLORS[3], // Orange
        backgroundColor: (context) => createGradient(context, PREDEFINED_COLORS[3]),
        fill: true,
    })),
});