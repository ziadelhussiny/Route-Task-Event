import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { Line } from 'react-chartjs-2';
import 'chart.js/auto';
import './App.css';

function App() {
    const [data, setData] = useState({ customers: [], transactions: [] });
    const [filter, setFilter] = useState({ customerName: '', transactionAmount: '' });
    const [customerSelection, setCustomerSelection] = useState(null);
    const [chartData, setChartData] = useState({});
    const [chartOptions, setChartOptions] = useState({});

    useEffect(() => {
        axios.get('http://localhost:5500/api/data')
            .then(response => setData(response.data))
            .catch(error => console.error('Error fetching data:', error));
    }, []);

    useEffect(() => {
        if (customerSelection) {
            const customerTransactions = data.transactions.filter(transaction => transaction.customer_id === customerSelection.id);
            const groupedByDate = customerTransactions.reduce((acc, transaction) => {
                acc[transaction.date] = (acc[transaction.date] || 0) + transaction.amount;
                return acc;
            }, {});

            setChartData({
                labels: Object.keys(groupedByDate),
                datasets: [{
                    label: 'Total Transaction Amount',
                    data: Object.values(groupedByDate),
                    backgroundColor: 'rgba(0, 0, 0, 1)',
                    borderColor: 'rgba(0, 0, 0, 1)',
                    borderWidth: 1,
                    pointBackgroundColor: 'rgba(0, 0, 0, 1)',
                    pointBorderColor: '#fff',
                    pointHoverBackgroundColor: '#fff',
                    pointHoverBorderColor: 'rgba(0, 0, 0, 1)',
                }]
            });

            setChartOptions({
                scales: {
                    y: {
                        type: 'linear',
                        min: 0,
                        max: Math.max(...Object.values(groupedByDate)) + 30
                    }
                }
            });
        }
    }, [customerSelection, data.transactions]);

    const handleFilterChange = (e) => {
        const { name, value } = e.target;
        setFilter({ ...filter, [name]: value });
    };

    const customerFilteration = data.customers.filter(customer =>
        customer.name.toLowerCase().includes(filter.customerName.toLowerCase())
    );

    const transactionFilteration = data.transactions.filter(transaction =>
        (filter.transactionAmount === '' || transaction.amount === Number(filter.transactionAmount))
    );

    const handleCustomerClick = (customer) => {
        setCustomerSelection(customer);
    };

    return (
        <div>
            <h1>Customer Transactions</h1>
            <div className="customer">
                <input
                    type="text"
                    name="customerName"
                    placeholder="Filter by customer name"
                    value={filter.customerName}
                    onChange={handleFilterChange}
                />
                <input
                    type="number"
                    name="transactionAmount"
                    placeholder="Filter by transaction amount"
                    value={filter.transactionAmount}
                    onChange={handleFilterChange}
                />
            </div>

            <table>
                <thead>
                    <tr>
                        <th>Customer Name</th>
                        <th>Transaction Date</th>
                        <th>Transaction Amount</th>
                    </tr>
                </thead>
                <tbody>
                    {customerFilteration.map(customer => (
                        transactionFilteration
                            .filter(transaction => transaction.customer_id === customer.id)
                            .map(transaction => (
                                <tr key={transaction.id} onClick={() => handleCustomerClick(customer)}>
                                    <td>{customer.name}</td>
                                    <td>{transaction.date}</td>
                                    <td>{transaction.amount}</td>
                                </tr>
                            ))
                    ))}
                </tbody>
            </table>

            {customerSelection && chartData.labels && chartData.datasets ? (
                <div className="chart-container">
                    <h2>Transactions for {customerSelection.name}</h2>
                    <Line data={chartData} options={chartOptions} />
                </div>
            ) : (
                customerSelection && <div className="no-data">No data available for the selected customer.</div>
            )}
        </div>
    );
}

export default App;
