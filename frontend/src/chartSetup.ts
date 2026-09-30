import { Chart as ChartJS, registerables } from 'chart.js';

ChartJS.register(...registerables);
ChartJS.defaults.font.family = "'Vazirmatn', Tahoma, sans-serif";