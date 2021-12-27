process.env.NODE_ENV = "test"

const request = require('supertest')
const app = require('../app')
const db = require('../db')

let testCompany
let testInvoice
let testIndustry

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
    await db.query('DELETE FROM companies')
    await db.query(`DELETE FROM invoices`)
})

afterAll(async function() {
    await db.end()
})

describe('/companies routes', function() {
    test('(GET /companies) Gets a list of 1 companies', async function() {
        const response = await request(app).get(`/companies`)
        expect(response.statusCode).toEqual(200)
        expect(response.body).toEqual({companies: [testCompany]})
    })

    test('(GET /companies/:code) Gets a company by code', async function() {
        testCompany.industries = testIndustry
        testCompany.invoices = testInvoice
        
        const response = await request(app).get(`/companies/${testCompany.code}`)
        expect(response.statusCode).toEqual(200)
        expect(response.body).toEqual({company: testCompany})
    })

    test('(POST /companies) Posts a new company', async function() {
        const response = await request(app)
            .post('/companies')
            .send({
                name: 'testCompanyTwo',
                description: 'is second test company'
            })
        
        expect(response.statusCode).toEqual(201)
        expect(response.body).toEqual(
            {company: {
                code: expect.any(String), 
                name: 'testCompanyTwo',
                description: 'is second test company'
                }
            })
    })

    test('(PUT /companies) Update a company', async function() {
        const response = await request(app)
        .put(`/companies/${testCompany.code}`)
        .send({
            name: 'newTestName',
            description: 'new test description'
        })
        
        expect(response.statusCode).toEqual(200)
        expect(response.body).toEqual({company: {id: testCompany.id, name: 'newTestName',
            description: 'new test description'}})
    })

    test('(DELETE /companies) Delete a company', async function() {
        const response = await request(app).delete(`/companies/${testCompany.code}`)
        expect(response.statusCode).toEqual(200)
        expect(response.body).toEqual({message: "Deleted"})
    })
})