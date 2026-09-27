import {describe,it,expect} from 'vitest';
import {checkStock} from './inventory';
import {catalogue} from './catalogue';
const products=[{...catalogue[0],stock:10}];
const item=(quantity:number,id='a')=>({id,productSlug:products[0].slug,variantId:products[0].variants[0].id,quantity});
describe('stock checks',()=>{
 it('accepts available stock',()=>expect(()=>checkStock([item(10)],products)).not.toThrow());
 it('combines separate logo/design cart lines',()=>expect(()=>checkStock([item(6),item(5,'b')],products)).toThrow('only 10'));
 it('counts free cards as physical stock',()=>expect(()=>checkStock([item(12)],products)).toThrow('only 10'));
 it('blocks sold-out products',()=>expect(()=>checkStock([item(1)],[{...products[0],stock:0}])).toThrow('only 0'));
});
