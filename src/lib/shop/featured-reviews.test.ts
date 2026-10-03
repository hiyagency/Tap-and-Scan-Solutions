import { beforeEach, describe, expect, it, vi } from "vitest";
vi.mock("server-only",()=>({}));
const mocks=vi.hoisted(()=>({db:vi.fn(),from:vi.fn(),select:vi.fn(),eq:vi.fn(),in:vi.fn(),order:vi.fn(),limit:vi.fn(),abortSignal:vi.fn()}));
vi.mock("./server",()=>({commerceDb:mocks.db}));
import { featuredReviews } from "./reviews";
beforeEach(()=>{
 vi.clearAllMocks();
 mocks.db.mockReturnValue(mocks);
 for(const method of ["from","select","eq","in","order","limit"] as const)mocks[method].mockReturnValue(mocks);
 mocks.abortSignal.mockResolvedValue({data:[],error:null});
});
describe("homepage review source",()=>{
 it("queries only approved reviews for visible product slugs",async()=>{
  await featuredReviews(["whatsapp"]);
  expect(mocks.eq).toHaveBeenCalledWith("status","approved");
  expect(mocks.in).toHaveBeenCalledWith("product_slug",["whatsapp"]);
  expect(mocks.limit).toHaveBeenCalledWith(3);
 });
 it("returns no invented fallback on database failure",async()=>{
  mocks.abortSignal.mockResolvedValue({data:null,error:{message:"Unavailable"}});
  expect(await featuredReviews(["whatsapp"])).toEqual([]);
 });
 it("keeps the homepage usable on timeout",async()=>{
  mocks.abortSignal.mockRejectedValue(new Error("Timeout"));
  expect(await featuredReviews(["whatsapp"])).toEqual([]);
 });
 it("does not query when no products are visible",async()=>{
  expect(await featuredReviews([])).toEqual([]);
  expect(mocks.db).not.toHaveBeenCalled();
 });
});
