const express = require("express");
const db = require('./db')
const companies = require('./routes/companies')
const invoices = require('./routes/invoices')
const industries = require('./routes/industries')

const app = express();
const ExpressError = require("./expressError")

app.use(express.json());
app.use('/companies', companies)
app.use('/invoices', invoices)
app.use('/industries', industries)

app.use(function(req, res, next) {
  const err = new ExpressError("Not Found", 404);
  return next(err);
});

app.use((err, req, res, next) => {
  res.status(err.status || 500);

  return res.json({
    error: err,
    message: err.message
  });
});

module.exports = app;