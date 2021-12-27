const express = require('express')
const slugify = require('slugify')
const db = require('../db')
const ExpressError = require('../expressError')
const router = new express.Router()

router.get('/', async function(req, res) {
    const results = await db.query(`SELECT * FROM companies`)

    return res.status(200).json({companies: results.rows})
})

router.get('/:code', async function(req, res, next) {
    try {
        const compResults = await db.query(
            `SELECT c.code, c.name, c.description, i.code AS industries
            FROM companies AS c
            LEFT JOIN companies_industries AS ci
            ON c.code = ci.company_code
            LEFT JOIN industries AS i
            ON ci.industry_code = i.code
            WHERE c.code=$1`, [req.params.code])

        const company = compResults.rows[0]
        const industries = compResults.rows.map(row => row.industries)
        company.industries = industries
        
        const invoiceResults = await db.query(
            `SELECT id, comp_code, amt, paid, add_date, paid_date
            FROM invoices
            WHERE comp_code = $1`,
            [req.params.code]
        )
        company.invoices = invoiceResults.rows

        return res.status(200).json({company: company})
    } catch(err) {
        return next(err)
    }
})

router.post('/', async function(req, res, next) {
    try {
        const { name, description } = req.body
        const code = slugify(name, {
            replacement: '',
            remove: `/[*+~.()'"!:@]/g}`,
            lower: true
        })
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

        return res.status(200).json({message: "Deleted"})
    } catch(err) {
        return next(err)
    }
})

module.exports = router