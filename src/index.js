const availableCharts = [];
const req = require.context('./charts/impl', true, /\.js$/);
req.keys().forEach((key) => {
  const chart = req(key).default;
  availableCharts.push(chart);
});

export default {
  chart({ chartType, container }) {
    if (typeof container === 'undefined') {
      throw Error('container is undefined');
    }
    const Chart = availableCharts.find(chart => chart.name === chartType);
    if (typeof Chart === 'undefined') {
      throw Error(`Chart type "${chartType}" not implemented.`);
    }
    return new Chart({ container });
  },
};
