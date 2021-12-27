process.env.NODE_ENV = "test"

const request = require('supertest')
const app = require('../app')
const db = require('../db')

let testCompany
let testInvoice

beforeEach(async function() {
    let compResult = await db.query(
        `INSERT INTO companies (code, name, description)
        VALUES ('test', 'TestCompany', 'is a test company')
        RETURNING code, name, description`
    )

    let invoiceResult = await db.query(
        `INSERT INTO invoices (id, comp_code, amt, paid, add_date, paid_date)
        VALUES (1, 'test', 2.99)
        RETURNING id, comp_code, amt, paid, add_date, paid_date`
    )

    let industryResult = await db.query(
        `INSERT INTO industries (code, industry)
        VALUES ('test', 'testIndustry')
        RETURNING code, industry`
    )
    testCompany = compResult.rows[0]
    testInvoice = invoiceResult.rows[0]
    testIndustry = industryResult.rows[0]
})

afterEach(async function() {
    await db.query('DELETE FROM invoices')
    await db.query(`DELETE FROM invoices`)
})

afterAll(async function() {
    await db.end()
})

describe('/invoices routes', function() {
    test('(GET /invoices) Gets a list of 1 invoice', function() {
        const response = await request(app).get(`/invoices`)
        expect(response.statusCode).toEqual(200)
        expect(response.body).toEqual({invoices: [testInvoice]})
    })

    test('(GET /invoices/:id) Gets a company by code', function() {
        testCompany.invoices = testInvoice
        const response = await request(app).get(`/invoices/${testCompany.code}`)
        expect(response.statusCode).toEqual(200)
        expect(response.body).toEqual({
            invoice: {testInvoice},
            companies: {name: testCompany.name, 
                description: testCompany.description}
        })
    })

    test('(POST /invoices) Posts a new company', function() {
        const testCompanyTwo = {
            code: 'testTwo',
            name: 'testCompanyTwo',
            description: 'is second test company'
        }

        const response = await request(app)
            .post('/invoices')
            .send({testCompanyTwo})
        
        expect(response.statusCode).toEqual(201)
        expect(response.body).toEqual({company: testCompanyTwo})
    })

    test('(PUT /invoices) Update a company', function() {
        const response = await request(app)
        .put(`/invoices/${testCompany.code}`)
        .send({
            name: 'newTestName',
            description: 'new test description'
        })
        
        expect(response.statusCode).toEqual(200)
        expect(response.body).toEqual({company: {id: testCompany.id, name: 'newTestName',
            description: 'new test description'}})
    })

    test('(DELETE /invoices) Delete a company', function() {
        const response = await request(app).delete(`/invoices/${testCompany.code}`)
        expect(response.statusCode).toEqual(200)
        expect(response.body).toEqual({message: "Deleted"})
    })
})