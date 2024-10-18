// Updated FX trade execution simulator with a simpler approach: USD, EUR, GBP, JPY, AUD, CAD

// Step 1: Set up your React project
// To start, run the following commands in your terminal:
//
// npx create-react-app fx-trade-simulator
// cd fx-trade-simulator
// npm start
//
// This will create a basic React app template.

// Step 2: Create basic components
// We will define a few components for our FX trade simulator.

// Import necessary libraries
import React, { useState, useEffect } from 'react';
import axios from 'axios';
import './App.css';
import { Container, Card, Button, Form, Alert, ListGroup, Row, Col } from 'react-bootstrap';
import 'bootstrap/dist/css/bootstrap.min.css';
import { Line } from 'react-chartjs-2';
import 'chart.js/auto';
import { NumericFormat } from 'react-number-format';

function App() {
  const [trades, setTrades] = useState([]);
  const [balances, setBalances] = useState({ USD: null, EUR: 0, GBP: 0, JPY: 0, AUD: 0, CAD: 0 });

  const addTrade = (trade) => {
    setTrades((prevTrades) => [...prevTrades, trade]);
    setBalances((prevBalances) => {
      const newBalances = { ...prevBalances };
      const { baseCurrency, targetCurrency, amount, exchangeRate } = trade;

      // Deduct from the base currency
      newBalances[baseCurrency] -= amount;

      // Add to the target currency with a spread adjustment (to simulate real-world spread)
      const adjustedExchangeRate = exchangeRate * 0.995; // Simulating a 0.5% spread loss
      newBalances[targetCurrency] += parseFloat((amount * adjustedExchangeRate).toFixed(2));

      return newBalances;
    });
  };

  const getExchangeRateToUSD = (currency) => {
    // You can implement a way to store or fetch the exchange rates to USD
    // For now, it's just an example with dummy values
    const rates = {
      EUR: 1.1, // Example value: 1 EUR = 1.1 USD
      GBP: 1.3,
      JPY: 0.009,
      AUD: 0.7,
      CAD: 0.8,
      USD: 1,
    };
    return rates[currency] || 1;
  };

  return (
    <Container className="my-5">
      <Card className="p-4 shadow-lg">
        <h1 className="text-center mb-4">FX Trade Execution Simulator</h1>
        {balances.USD === null ? (
          <InitialBalanceForm setBalances={setBalances} />
        ) : (
          <Row>
            <Col md={6}>
              <Balances balances={balances} />
            </Col>
            <Col md={6}>
              <TradeForm addTrade={addTrade} balances={balances} />
            </Col>
          </Row>
        )}
        {balances.USD !== null && (
          <Row className="mt-4">
            <Col md={{ span: 10, offset: 1 }}>
              <Portfolio trades={trades} />
            </Col>
          </Row>
        )}
      </Card>
    </Container>
  );
}

function InitialBalanceForm({ setBalances }) {
  const [initialBalance, setInitialBalance] = useState('');

  const handleSetBalance = () => {
    if (initialBalance && parseFloat(initialBalance) > 0) {
      const balance = parseFloat(initialBalance);
      setBalances((prevBalances) => ({ ...prevBalances, USD: balance }));
    }
  };

  return (
    <Card className="p-4 mb-4">
      <h2 className="mb-3">Set Initial USD Balance</h2>
      <Form>
        <Form.Group controlId="initialBalance">
          <NumericFormat
            className="form-control"
            thousandSeparator={true}
            decimalScale={2}
            fixedDecimalScale={true}
            placeholder="Enter initial USD balance"
            value={initialBalance}
            onValueChange={(values) => setInitialBalance(values.value)}
          />
        </Form.Group>
        <Button className="mt-3" variant="primary" onClick={handleSetBalance}>Set Balance</Button>
      </Form>
    </Card>
  );
}

function Balances({ balances }) {
  const formatMoney = (value) => {
    return value.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  };

  return (
    <Card className="p-4 mb-4">
      <h2 className="mb-3">Current Balances</h2>
      <ListGroup variant="flush">
        {Object.entries(balances).map(([currency, balance]) => (
          <ListGroup.Item key={currency} className="d-flex justify-content-between align-items-center">
            <span>
              {currency === 'USD' ? '$' : currency === 'EUR' ? '€' : currency === 'GBP' ? '£' : currency === 'JPY' ? '¥' : currency === 'AUD' ? 'A$' : 'C$'}
            </span>
            <span>{formatMoney(balance)}</span>
          </ListGroup.Item>
        ))}
      </ListGroup>
    </Card>
  );
}

function TradeForm({ addTrade, balances }) {
  const [baseCurrency, setBaseCurrency] = useState('');
  const [targetCurrency, setTargetCurrency] = useState('');
  const [amount, setAmount] = useState('');
  const [exchangeRate, setExchangeRate] = useState(null);
  const [error, setError] = useState(null);
  const [preview, setPreview] = useState(null);

  const API_KEY = process.env.REACT_APP_API_KEY;

  useEffect(() => {
    const fetchExchangeRate = async () => {
      if (baseCurrency && targetCurrency) {
        try {
          const response = await axios.get(
            `https://api.1forge.com/quotes?pairs=${baseCurrency}/${targetCurrency}&api_key=${API_KEY}`
          );
          const selectedPair = response.data.find(pair => pair.s === `${baseCurrency}/${targetCurrency}`);
          if (selectedPair) {
            setExchangeRate(selectedPair.p);
            setError(null);
            setPreview(null);
          } else {
            setExchangeRate(null);
            setError('Unable to find the selected currency pair.');
          }
        } catch (error) {
          setError('Unable to fetch exchange rate. Please try again later.');
          setExchangeRate(null);
        }
      } else {
        setExchangeRate(null);
        setError(null);
      }
    };

    if (baseCurrency && targetCurrency) {
      fetchExchangeRate();
    }
  }, [baseCurrency, targetCurrency]);

  useEffect(() => {
    if (baseCurrency && targetCurrency && amount && exchangeRate) {
      const tradeAmount = parseFloat(amount);

      if (balances[baseCurrency] >= tradeAmount) {
        const adjustedExchangeRate = exchangeRate * 0.995; // Simulating a 0.5% spread loss for preview
        setPreview({
          baseCurrency,
          targetCurrency,
          newBaseBalance: (balances[baseCurrency] - tradeAmount).toFixed(2),
          newTargetBalance: (balances[targetCurrency] + tradeAmount * adjustedExchangeRate).toFixed(2),
          baseChange: -tradeAmount,
          targetChange: (tradeAmount * adjustedExchangeRate).toFixed(2),
        });
      } else {
        setPreview(null);
      }
    } else {
      setPreview(null);
    }
  }, [baseCurrency, targetCurrency, amount, exchangeRate, balances]);

  const handleTrade = () => {
    if (baseCurrency && targetCurrency && amount && exchangeRate) {
      const tradeAmount = parseFloat(amount);

      if (balances[baseCurrency] >= tradeAmount) {
        addTrade({
          baseCurrency,
          targetCurrency,
          amount: tradeAmount,
          exchangeRate: parseFloat(exchangeRate.toFixed(4))
        });
        setBaseCurrency('');
        setTargetCurrency('');
        setAmount('');
        setExchangeRate(null);
        setError(null);
        setPreview(null);
      } else {
        setError('Insufficient balance to execute this trade.');
      }
    }
  };

  return (
    <Card className="p-4 mb-4">
      <h2 className="mb-3">Place a Trade</h2>
      <Form>
        <Form.Group controlId="baseCurrency">
          <Form.Label>Select Base Currency</Form.Label>
          <Form.Control as="select" value={baseCurrency} onChange={(e) => setBaseCurrency(e.target.value)}>
            <option value="">Select Base Currency</option>
            {['USD', 'EUR', 'GBP', 'JPY', 'AUD', 'CAD'].map((currency) => (
              <option key={currency} value={currency}>{currency}</option>
            ))}
          </Form.Control>
        </Form.Group>
        <Form.Group controlId="targetCurrency">
          <Form.Label>Select Target Currency</Form.Label>
          <Form.Control as="select" value={targetCurrency} onChange={(e) => setTargetCurrency(e.target.value)}>
            <option value="">Select Target Currency</option>
            {['USD', 'EUR', 'GBP', 'JPY', 'AUD', 'CAD']
              .filter((currency) => currency !== baseCurrency)
              .map((currency) => (
                <option key={currency} value={currency}>{currency}</option>
              ))}
          </Form.Control>
        </Form.Group>
        <Form.Group controlId="amount">
          <Form.Label>Amount</Form.Label>
          <NumericFormat
            className="form-control"
            thousandSeparator={true}
            decimalScale={2}
            fixedDecimalScale={true}
            placeholder="Enter amount"
            value={amount}
            onValueChange={(values) => setAmount(values.value)}
          />
        </Form.Group>
        {exchangeRate && <Alert variant="success" className="mt-3">Current Exchange Rate: {exchangeRate} <span className='info-icon' title={`1 ${baseCurrency} is worth ${exchangeRate} ${targetCurrency}`}>ℹ️</span></Alert>}
        {preview && (
          <Alert variant="info" className="mt-3">
            <p className="text-muted">Note: A 0.5% spread is applied to all trades to simulate real-world trading conditions.</p>
            {`${preview.baseCurrency} Balance after Trade: ${preview.baseCurrency === 'USD' ? '$' : preview.baseCurrency === 'EUR' ? '€' : preview.baseCurrency === 'GBP' ? '£' : preview.baseCurrency === 'JPY' ? '¥' : preview.baseCurrency === 'AUD' ? 'A$' : 'C$'}${parseFloat(preview.newBaseBalance).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })} (${parseFloat(preview.baseChange).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })})`}<br />
            {`${preview.targetCurrency} Balance after Trade: ${preview.targetCurrency === 'USD' ? '$' : preview.targetCurrency === 'EUR' ? '€' : preview.targetCurrency === 'GBP' ? '£' : preview.targetCurrency === 'JPY' ? '¥' : preview.targetCurrency === 'AUD' ? 'A$' : 'C$'}${parseFloat(preview.newTargetBalance).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })} (+${parseFloat(preview.targetChange).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })})`}
          </Alert>
        )}
        {error && <Alert variant="danger" className="mt-3">{error}</Alert>}
        <Button className="mt-3" variant="primary" onClick={handleTrade}>Execute Trade</Button>
      </Form>
    </Card>
  );
}

function Portfolio({ trades }) {
  const formatMoney = (value) => {
    return value.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  };

  return (
    <Card className="p-4">
      <h2 className="mb-3">Transaction History</h2>
      <ListGroup variant="flush">
        {trades.map((trade, index) => (
          <ListGroup.Item key={index}>
            {`Traded ${formatMoney(trade.amount)} ${trade.baseCurrency} to receive ${formatMoney(trade.amount * trade.exchangeRate * 0.995)} ${trade.targetCurrency} at rate ${(trade.exchangeRate * 0.995).toFixed(4)}`}
          </ListGroup.Item>
        ))}
      </ListGroup>
    </Card>
  );
}

export default App;
