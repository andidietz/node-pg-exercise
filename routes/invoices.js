const express = require('express')
const db = require('../db')
const ExpressError = require('../expressError')
const router = new express.Router()

router.get('/', async function(req, res, next) {
    try{
        const results = await db.query(
            `SELECT id, comp_code, amt, paid, add_date, paid_date 
            FROM invoices`
        )

        return res.status(200).json({invoices: results.rows})
    } catch(err) {
        return next(err)
    }
})

router.get('/:id', async function(req, res, next) {
    try {
        const results = await db.query(
            `SELECT i.id, i.comp_code, i.amt, i.paid, i.add_date,
                i.paid_date, c.name, c.description
            FROM invoices AS i
            INNER JOIN companies AS c ON (i.comp_code = c.code)
            WHERE id = $1`, 
            [req.params.id]
        )
        
        if (results.rows.length === 0) {
            throw new ExpressError('Invoice not found', 404)
        }
    
        const {comp_code, amt, paid, add_date, 
            paid_date, name, description} = results.rows[0]
    
        return res.status(200).json(
            {invoice: {comp_code, amt, paid, add_date, paid_date},
                companies: {name, description}}
        )
    } catch(err) {
        return next(err)
    }
})

router.post('/', async function(req, res, next) {
    try {
        const results = await db.query(
            `INSERT INTO invoices (comp_code, amt)
            VALUES ($1, $2)
            RETURNING id, comp_code, amt, paid, add_date, paid_date`, 
            [req.body.comp_code, req.body.amt]
        )
    
        const {id, comp_code, amt, paid, add_date, 
            paid_date} = results.rows[0]
    
        return res.status(201).json({invoice: {
            id, comp_code, amt, paid, add_date, paid_date
        }})
    } catch(err) {
        return next(err)
    }
})

router.put('/:id', async function(req, res, next) {
    try {
        const invoiceGetResults = await db.query(
            `SELECT id, paid, paid_date 
            FROM invoices
            WHERE id=$1`,
            [req.params.id]
        )
        let current_paid = invoiceGetResults.rows[0].paid
        let current_paid_date = invoiceGetResults.rows[0].paid_date
        let updated_paid_value = req.body.paid

        if (updated_paid_value === true & current_paid === false) {
            current_paid = true
            current_paid_date = new Date()
        } else if (updated_paid_value === false & current_paid === true) {
            current_paid = false
            current_paid_date = null
        } else {
            current_paid_date = invoiceGetResults.rows[0].paid_date
        }

        const results = await db.query(`
            UPDATE invoices SET amt=$1, paid=$2, paid_date=$3
            WHERE id=$4
            RETURNING id, comp_code, amt, paid, add_date, paid_date`,
            [req.body.amt, current_paid, current_paid_date, req.params.id]
        )

        if (results.rows.length === 0) {
            throw new ExpressError('Invoice not found', 404)
        }
    
        const {id, comp_code, amt, paid, paid_date, add_date} = results.rows[0]

        return res.status(200).json({invoice: {
            id, comp_code, amt, paid, add_date, paid_date
        }})
    } catch(err) {
        return next(err)
    }
})

router.delete('/:id', async function(req, res, next) {
    try {
        const results = await db.query(`
            DELETE FROM invoices WHERE id = $1
            RETURNING id`, 
            [req.params.id]
        )

        if (results.rows.length === 0) {
            throw new ExpressError('Invoice not found', 404)
        }
        return res.status(200).json({status: "deleted"})
    } catch(err) {
        return next(err)
    }
})

module.exports = router