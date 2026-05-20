'use client';

export default function OrderHistory({ orders }: { orders: any[] }) {
  if (!orders || orders.length === 0) {
    return (
      <div className="bg-gray-50 border border-gray-100 p-8 rounded-xl text-center">
        <p className="text-gray-500">You haven't placed any orders yet.</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {orders.map((order) => (
        <div key={order.id} className="border border-royal-blue/10 rounded-xl p-5 hover:border-gold transition-colors">
          <div className="flex justify-between items-start mb-2">
            <div>
              <p className="text-sm text-gray-500 font-mono">#{order.razorpay_order_id?.slice(6, 16) || order.id.slice(0, 8)}</p>
              <p className="font-semibold text-lg">₹{order.amount}</p>
            </div>
            <span className={`px-3 py-1 text-xs font-bold uppercase tracking-wider rounded-full ${
              order.status === 'captured' ? 'bg-green-100 text-green-700' :
              order.status === 'pending' ? 'bg-yellow-100 text-yellow-700' :
              'bg-red-100 text-red-700'
            }`}>
              {order.status}
            </span>
          </div>
          <p className="text-sm text-gray-400">
            {new Date(order.created_at).toLocaleDateString('en-IN', {
              year: 'numeric', month: 'short', day: 'numeric'
            })}
          </p>
        </div>
      ))}
    </div>
  );
}
