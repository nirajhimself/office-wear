import { prisma } from "@/lib/prisma";
import { createProduct } from "@/lib/admin/actions";

export default async function ProductsPage() {
  const [products, categories] = await Promise.all([
    prisma.product.findMany({
      include: {
        category: true,
        variants: { include: { inventory: true } },
        _count: { select: { images: true } },
      },
      orderBy: { createdAt: "desc" },
    }),
    prisma.category.findMany({ orderBy: { name: "asc" } }),
  ]);

  return (
    <div className="admin-page">
      <div className="admin-page-head">
        <div>
          <span className="eyebrow-dark">CATALOG</span>
          <h1>
            The product
            <br />
            <em>floor.</em>
          </h1>
        </div>
      </div>

      <form action={createProduct} className="admin-form admin-product-form">
        <label className="span-2">
          Product name
          <input name="name" placeholder="The Oxford Shirt" required />
        </label>
        <label className="span-2">
          URL slug
          <input name="slug" placeholder="the-oxford-shirt" />
          <small>Leave blank to build it from the name.</small>
        </label>

        <label>
          Section
          <select name="category" defaultValue="shirts">
            {categories.map((category) => (
              <option key={category.id} value={category.slug}>
                {category.name}
              </option>
            ))}
          </select>
        </label>
        <label>
          Gender
          <select name="gender" defaultValue="Unisex">
            <option>Unisex</option>
            <option>Men</option>
            <option>Women</option>
          </select>
        </label>
        <label>
          Price (₹)
          <input name="price" type="number" min="1" step="1" placeholder="2490" required />
        </label>
        <label>
          Compare at (₹)
          <input name="compareAt" type="number" min="1" step="1" placeholder="3290" />
          <small>Optional. Shows as a struck-through MRP.</small>
        </label>

        <label className="span-2">
          Sizes
          <input name="sizes" placeholder="XS, S, M, L, XL" required />
          <small>Comma separated. One variant per size × colour.</small>
        </label>
        <label className="span-2">
          Colours
          <input name="colors" placeholder="White, Black" required />
          <small>Spelling is used in the variant key — keep it consistent.</small>
        </label>

        <label>
          SKU prefix
          <input name="skuBase" placeholder="OW-201" required />
        </label>
        <label>
          Opening stock
          <input name="stock" type="number" min="0" step="1" defaultValue={0} />
          <small>Applied to every variant.</small>
        </label>
        <label>
          Status
          <select name="status" defaultValue="DRAFT">
            <option value="DRAFT">Draft — hidden from the store</option>
            <option value="ACTIVE">Active — live immediately</option>
          </select>
        </label>
        <label className="admin-check">
          <span>Featured</span>
          <input name="featured" type="checkbox" />
          <small>Pins it to the top of the shop grid.</small>
        </label>

        <label className="span-4">
          Images
          <textarea
            name="images"
            placeholder={"/products/oxford-shirt-front.jpg\n/products/oxford-shirt-back.jpg"}
            required
          />
          <small>
            One per line. The first is the card image, the second shows on hover.
            Upload files to <code>public/products/</code> and reference them as
            <code> /products/your-file.jpg</code>.
          </small>
        </label>

        <label className="span-4">
          Description
          <textarea
            name="description"
            placeholder="A cotton-twill shirt cut for long days…"
            required
          />
        </label>

        <button className="button button-dark span-4">Add product</button>
      </form>

      <div className="admin-table-wrap">
        <table className="admin-table">
          <thead>
            <tr>
              <th>Product</th>
              <th>Section</th>
              <th>Variants</th>
              <th>Stock</th>
              <th>Images</th>
              <th>Status</th>
            </tr>
          </thead>
          <tbody>
            {products.map((product) => {
              const stock = product.variants.reduce(
                (total, variant) => total + (variant.inventory?.stock ?? 0),
                0,
              );
              return (
                <tr key={product.id}>
                  <td>
                    <strong>{product.name}</strong>
                    <small>{product.slug}</small>
                  </td>
                  <td>{product.category.name}</td>
                  <td>{product.variants.length}</td>
                  <td className={stock === 0 ? "low-stock" : undefined}>{stock}</td>
                  <td className={product._count.images < 2 ? "low-stock" : undefined}>
                    {product._count.images}
                  </td>
                  <td>{product.status}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
