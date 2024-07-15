import React, { useEffect, useState, useCallback } from 'react';
import { Line } from 'react-chartjs-2';
import 'chart.js/auto';
import './App.css';
import axios from 'axios';
import { data as localData } from './api';

function App() {
    const [useLocalData, setUseLocalData] = useState(false); 
    const [data, setData] = useState({ customers: [], transactions: [] });
    const [filter, setFilter] = useState({ customerName: '', transactionAmount: '' });
    const [customerSelection, setCustomerSelection] = useState(null);
    const [chartData, setChartData] = useState({});
    const [chartOptions, setChartOptions] = useState({});

    const fetchData = useCallback(async () => {
        try {
            if (useLocalData) {
                setData(localData); 
            } else {
                const response = await axios.get('http://localhost:5500/api/data');
                setData(response.data);
            }
        } catch (error) {
            console.error('Error fetching data:', error);
        }
    }, [useLocalData]);

    
    useEffect(() => {
        fetchData();
    }, [fetchData]);

    useEffect(() => {
        const createGradient = () => {
            if (customerSelection) {
                const ctx = document.createElement('canvas').getContext('2d');
                const gradient = ctx.createLinearGradient(0, 0, 0, 400);
                gradient.addColorStop(0, 'rgba(75, 192, 192, 0.2)');
                gradient.addColorStop(1, 'rgba(75, 192, 192, 0.8)');
                return gradient;
            }
            return null; 
        };

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
                    fill: true,
                    backgroundColor: createGradient(),
                    borderColor: 'rgba(75, 192, 192, 1)',
                    borderWidth: 2,
                    pointBackgroundColor: 'rgba(75, 192, 192, 1)',
                    pointBorderColor: '#fff',
                    pointHoverBackgroundColor: '#fff',
                    pointHoverBorderColor: 'rgba(75, 192, 192, 1)',
                }]
            });

            setChartOptions({
                scales: {
                    y: {
                        type: 'linear',
                        min: 0,
                        max: Math.max(...Object.values(groupedByDate)) + 30,
                        grid: {
                            display: true,
                            drawBorder: true,
                            color: 'rgba(0, 0, 0, 0.1)',
                        },
                        ticks: {
                            font: {
                                family: 'Roboto, sans-serif',
                                size: 12,
                            },
                            color: '#333',
                        }
                    },
                    x: {
                        grid: {
                            display: false,
                        },
                        ticks: {
                            font: {
                                family: 'Roboto, sans-serif',
                                size: 12,
                            },
                            color: '#333',
                        }
                    }
                },
                plugins: {
                    legend: {
                        display: true,
                        position: 'top',
                        labels: {
                            font: {
                                family: 'Roboto, sans-serif',
                                size: 14,
                                weight: 'bold',
                            },
                            color: '#333',
                        }
                    },
                    tooltip: {
                        backgroundColor: 'rgba(0, 0, 0, 0.8)',
                        title: {
                            font: {
                                family: 'Roboto, sans-serif',
                                size: 14,
                            },
                            color: '#fff',
                            display: true,
                            padding: 10,
                        },
                        body: {
                            font: {
                                family: 'Roboto, sans-serif',
                                size: 12,
                            },
                            color: '#fff',
                            display: true,
                            padding: 10,
                        },
                        callbacks: {
                            label: function (context) {
                                let label = context.dataset.label || '';
                                if (label) {
                                    label += ': ';
                                }
                                if (context.parsed.y !== null) {
                                    label += new Intl.NumberFormat().format(context.parsed.y);
                                }
                                return label;
                            }
                        }
                    }
                },
                animation: {
                    duration: 2000, 
                    easing: 'easeInOutQuad', 
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
            <div className="customerinput">
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
                <button onClick={() => setUseLocalData(!useLocalData)} className="btn">
                    Toggle Data Source: {useLocalData ? 'Local' : 'API'}
                </button>
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

export default App;
