// src/app/api/v1/products/[id]/route.ts
import { NextResponse } from 'next/server';
import { editProduct, removeProduct, getProducts } from '../controllers/productController';

export async function GET(request: Request, { params }: { params: { id: string } }) {
  try {
    const products = await getProducts();
    const product = (products as any[]).find((p) => p.id === params.id);
    if (!product) return NextResponse.json({ error: 'Not found' }, { status: 404 });
    return NextResponse.json(product);
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function PATCH(request: Request, { params }: { params: { id: string } }) {
  try {
    const payload = await request.json();
    const updated = await editProduct(params.id, payload);
    return NextResponse.json(updated);
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 400 });
  }
}

export async function DELETE(request: Request, { params }: { params: { id: string } }) {
  try {
    await removeProduct(params.id);
    return NextResponse.json({ success: true });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 400 });
  }
}
