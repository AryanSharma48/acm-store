// src/app/api/v1/products/route.ts
import { NextResponse } from 'next/server';
import { addProduct, getProducts } from './controllers/productController';

export async function GET(request: Request) {
  try {
    const products = await getProducts();
    return NextResponse.json(products);
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const payload = await request.json();
    const product = await addProduct(payload);
    return NextResponse.json(product, { status: 201 });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 400 });
  }
}
