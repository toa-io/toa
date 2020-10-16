const string = () => Math.random().toString(36).substring(2);

const criteria = jest.fn(() => ({
    prop: string(),
}));

const query = {
    criteria: string(),
    sort: 'a,b:desc,c:asc',
    omit: '100',
    select: '10',
};

const sort = {
    a: 1,
    b: -1,
    c: 1,
};

const omit = +query.omit;
const select = +query.select;

module.exports = { criteria, query, sort, omit, select };
