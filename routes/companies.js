const express = require('express')
const db = require('../db')
const ExpressError = require('../expressError')
const router = new express.Router()

router.get('/', async function(req, res) {
    const results = await db.query(`SELECT * FROM companies`)

    return res.json({companies: results.rows})
})

router.get('/:code', async function(req, res, next) {
    try {
        const compResults = await db.query(
            `SELECT code, name, description
            FROM companies 
            WHERE code=$1`, [req.params.code])

        const invoiceResults = await db.query(
            `SELECT id, comp_code, amt, paid, add_date, paid_date
            FROM invoices
            WHERE comp_code = $1`,
            [req.params.code]
        )
        const companies = compResults.rows[0]
        companies.invoices = invoiceResults.rows

        return res.json({companies})
    } catch(err) {
        return next(err)
    }
})

router.post('/', async function(req, res, next) {
    try {
        const { code, name, description } = req.body

        const results = await db.query(
            `INSERT INTO companies (code, name, description)
            VALUES ($1, $2, $3)
            RETURNING code, name, description`, 
            [code, name, description]
        )
    
        return res.status(201).json({company: results.rows[0]})
    } catch(err) {
        return next(err)
    }
})

router.put('/:code', async function(req, res, next) {
    try{
        const code = req.params.code
        const { name, description } = req.body

        const results = await db.query(
            `UPDATE companies SET name=$1, description=$2
            WHERE code=$3
            RETURNING code, name, description`,
            [name, description, code]
        )

        return res.status(200).json({company: results.rows[0]})
    } catch(err) {
        return next(err)
    }
})

router.delete('/:code', async function(req, res, next) {
    try {
        const results = await db.query(
            `DELETE FROM companies WHERE code=$1
            RETURNING code`,
            [req.params.code]
        )

        if (results.rows.length === 0) {
            throw new ExpressError('Company not found', 404)
        }

        return res.json({message: "Deleted"})
    } catch(err) {
        return next(err)
    }
})

module.exports = router