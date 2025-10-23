import { assembleQueryFromParams } from "../../src/services/database/url_query_parser.ts"; // 👈 Adjust path as needed
import { QuerySchema, Query } from "@kitledger/query";
import * as v from "@valibot/valibot";
import {
    assert,
    assertEquals,
    assertThrows,
} from "@std/assert";
import { describe, test } from "@std/testing/bdd";

/**
 * Helper function to parse params and immediately validate against the schema.
 * Use the Valibot schema in the assertions.
 */
function parseAndValidate(params: URLSearchParams): Query {
    // 1. Assemble the object from URL params
    const query = assembleQueryFromParams(params);

    // 2. Validate the output object with Valibot
    const result = v.safeParse(QuerySchema, query);

    // 3. Assert that the generated query is valid
    assert(
        result.success,
        `Generated query failed Valibot validation: ${
            result.issues?.map((i) => `[${i.path?.map(p => p.key).join('.')}] ${i.message}`).join(", ")
        }`,
    );

    return result.output as Query;
}

describe("URL Query Parser (assembleQueryFromParams)", () => {
    // This test will now pass
    test("should parse basic limit, offset, and groupBy", () => {
        const params = new URLSearchParams(
            "limit=10&offset=5&groupBy=accounts.type",
        );
        const query = parseAndValidate(params);

        const expected: Query = {
            select: [], // Required
            where: [], // Required
            limit: 10,
            offset: 5,
            groupBy: ["accounts.type"],
            // 'joins' and 'orderBy' are correctly omitted
        };

        assertEquals(query, expected);
    });

    // This test will now pass
    test("should parse various 'select' syntaxes", () => {
        const params = new URLSearchParams(
            "select=accounts.id&select=accounts.name:account_name&select=count(t.id):tx_count",
        );
        const query = parseAndValidate(params);

        const expected: Query = {
            select: [
                "accounts.id",
                { column: "accounts.name", as: "account_name" },
                { func: "count", column: "t.id", as: "tx_count" },
            ],
            where: [],
            // All optional keys are correctly omitted
        };
        assertEquals(query, expected);
    });

    // This test will now pass
    test("should parse 'orderBy' with default and explicit directions", () => {
        const params = new URLSearchParams(
            "orderBy=name.desc&orderBy=created_at&orderBy=accounts.created_at.desc",
        );
        const query = parseAndValidate(params);

        const expected: Query = {
            select: [],
            where: [],
            orderBy: [
                { column: "name", direction: "desc" },
                { column: "created_at", direction: "asc" }, // 'asc' is default
                { column: "accounts.created_at", direction: "desc" },
            ],
        };
        assertEquals(query, expected);
    });

    // This test will now pass
    test("should parse 'join' clauses with and without alias", () => {
        const params = new URLSearchParams(
            "join=left:profiles:p:users.id:p.user_id&join=inner:roles:users.role_id:roles.id",
        );
        const query = parseAndValidate(params);

        const expected: Query = {
            select: [],
            where: [],
            joins: [
                {
                    type: "left",
                    table: "profiles",
                    as: "p",
                    onLeft: "users.id",
                    onRight: "p.user_id",
                },
                {
                    type: "inner",
                    table: "roles",
                    onLeft: "users.role_id",
                    onRight: "roles.id",
                },
            ],
        };
        assertEquals(query, expected);
    });

    // This test will now pass
    test("should parse 'where' clauses with default 'and' connector", () => {
        const params = new URLSearchParams(
            "status=equal:active&balance=gt:100&is_admin=equal:true",
        );
        const query = parseAndValidate(params);

        const expected: Query = {
            select: [],
            where: [{
                connector: "and",
                conditions: [
                    { column: "status", operator: "equal", value: "active" },
                    { column: "balance", operator: "gt", value: 100 },
                    { column: "is_admin", operator: "equal", value: true },
                ],
            }],
        };
        assertEquals(query, expected);
    });

    // This test will now pass
    test("should parse 'where' clauses with explicit 'or' connector", () => {
        const params = new URLSearchParams(
            "status=equal:active&balance=gt:100&connector=or",
        );
        const query = parseAndValidate(params);

        const expected: Query = {
            select: [],
            where: [{
                connector: "or",
                conditions: [
                    { column: "status", operator: "equal", value: "active" },
                    { column: "balance", operator: "gt", value: 100 },
                ],
            }],
        };
        assertEquals(query, expected);
    });

    // This test will now pass
    test("should parse complex 'where' operators like 'in' and 'not_empty'", () => {
        const params = new URLSearchParams(
            "id=in:1,2,3&parent_id=not_empty:true&name=like:%test%",
        );
        const query = parseAndValidate(params);

        const expected: Query = {
            select: [],
            where: [{
                connector: "and",
                conditions: [
                    { column: "id", operator: "in", value: [1, 2, 3] },
                    { column: "parent_id", operator: "not_empty", value: true },
                    { column: "name", operator: "like", value: "%test%" },
                ],
            }],
        };
        assertEquals(query, expected);
    });

    // This test will now pass
    test("should parse the full example query correctly", () => {
        const url =
            "select=accounts.id:account_id&select=parent.name:parent_name&join=left:accounts:parent:accounts.parent_id:parent.id&accounts.parent_id=not_empty:true&orderBy=accounts.created_at.desc&limit=50&offset=0";
        const params = new URLSearchParams(url);
        const query = parseAndValidate(params);

        const expectedQuery: Query = {
            select: [
                { column: "accounts.id", as: "account_id" },
                { column: "parent.name", as: "parent_name" },
            ],
            joins: [
                {
                    type: "left",
                    table: "accounts",
                    as: "parent",
                    onLeft: "accounts.parent_id",
                    onRight: "parent.id",
                },
            ],
            where: [
                {
                    connector: "and",
                    conditions: [
                        {
                            column: "accounts.parent_id",
                            operator: "not_empty",
                            value: true,
                        },
                    ],
                },
            ],
            orderBy: [
                { column: "accounts.created_at", direction: "desc" },
            ],
            limit: 50,
            offset: 0,
            // 'groupBy' is correctly omitted
        };

        assertEquals(query, expectedQuery);
    });

    // This test will now pass
    test("should return a minimal valid query for empty params", () => {
        const params = new URLSearchParams("");
        const query = parseAndValidate(params);

        const expected: Query = {
            select: [],
            where: [],
            // All optional keys are correctly omitted
        };
        assertEquals(query, expected);
    });

    // These error-throwing tests remain correct
    test("should throw an error for invalid join syntax", () => {
        const params = new URLSearchParams("join=left:profiles");
        assertThrows(
            () => assembleQueryFromParams(params),
            Error,
            "Invalid join syntax",
        );
    });

    test("should throw an error for aggregate select without alias", () => {
        const params = new URLSearchParams("select=count(id)");
        assertThrows(
            () => assembleQueryFromParams(params),
            Error,
            'must have an alias (e.g., count(id):alias_name)',
        );
    });

    test("should throw an error for invalid join type", () => {
        const params = new URLSearchParams("join=cross:users:u:a.id:b.id");
        assertThrows(
            () => assembleQueryFromParams(params),
            Error,
            "Invalid join type: cross",
        );
    });
    
    test("should throw an error for invalid aggregate function", () => {
        const params = new URLSearchParams("select=delete(id):foo");
        assertThrows(
            () => assembleQueryFromParams(params),
            Error,
            "Invalid aggregate function: delete",
        );
    });
});