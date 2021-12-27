const express = require('express')
const db = require('../db')
const ExpressError = require('../expressError')
const router = new express.Router()

router.get("/", async function (req, res, next) {
    try {
        const industryResults = await db.query(
            `SELECT i.code, i.industry, c.code AS companies
                FROM industries AS i
                    LEFT JOIN companies_industries as ci
                    ON i.code = ci.industry_code
                    LEFT JOIN companies as c
                    ON ci.company_code = c.code`,
        )

        return res.status(200).json({industries: industryResults.rows})
    } catch (err) {
        return next(err)
    }
  })

router.post('/', async function(req, res, next) {
    try{
        const results = await db.query(
            `INSERT INTO industries (code, industry)
            VALUES ($1, $2)
            RETURNING code, industry`,
            [req.body.code, req.body.industry]
        )
        
        return res.status(201).json({industry: results.rows[0]})
    } catch(err) {
        return next(err)
    }
})

router.post('/:code', async function(req, res, next) {
    try{
        const results = await db.query(
            `INSERT INTO companies_industries (company_code, industry_code)
            VALUES ($1, $2)
            RETURNING company_code, industry_code`,
            [req.body.company_code, req.params.code]
        )
        
        const industryResults = await db.query(
            `SELECT i.code, i.industry, c.code AS companies
                FROM industries AS i
                    LEFT JOIN companies_industries as ci
                    ON i.code = ci.industry_code
                    LEFT JOIN companies as c
                    ON ci.company_code = c.code
                WHERE i.code=$1`,
            [req.params.code]
        )

        return res.status(200).json({industry: results.rows})
    } catch(err) {
        return next(err)
    }
})

module.exports = router