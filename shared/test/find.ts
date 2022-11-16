import findUp from 'find-up';

let root: string;

export function getRoot()
{
    if (root) return root;

    root = (findUp.sync('nx.json') as string).replace('nx.json', '');

    return root;
}
