const string = () => Math.random().toString(36).substring(2);

const criteria = jest.fn(() => ({
    prop: string(),
}));

const query = {
    criteria: string(),
    sort: 'a,b:desc,c:asc',
    omit: '100',
    select: '10',
    projection: ['a', 'b'],
};

const properties = {
    a: {
        type: 'string',
    },
    b: {
        type: 'number',
    },
    c: {
        type: 'number',
    },
};

const sort = [{key: 'a', direction: 1}, {key: 'b', direction: -1}, {key: 'c', direction: 1}];

const omit = +query.omit;
const select = +query.select;

const options = {
    projection: ['a'],
};

module.exports = { criteria, query, properties, sort, omit, select, options };
