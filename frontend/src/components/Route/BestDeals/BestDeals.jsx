import React, { useEffect, useState } from "react";
import { useSelector } from "react-redux";
import styles from "../../../styles/styles";
import ProductCard from "../ProductCard/ProductCard";

const BestDeals = () => {
  const [data, setData] = useState([]);
  const { allProducts, isLoading, error } = useSelector(
    (state) => state.products
  );

  useEffect(() => {
    console.log("allProducts in BestDeals:", allProducts);

    if (Array.isArray(allProducts) && allProducts.length > 0) {
      // ✅ Create a copy before sorting to avoid mutating Redux state
      const sortedData = [...allProducts].sort(
        (a, b) => (b.sold_out || 0) - (a.sold_out || 0)
      );
      const firstFive = sortedData.slice(0, 5);
      setData(firstFive);
    } else {
      setData([]); // ✅ Clear data if products are empty or invalid
    }
  }, [allProducts]);

  return (
    <div>
      <div className={styles.section}>
        <div className={styles.heading}>
          <h1>Best Deals</h1>
        </div>

        <div className="grid grid-cols-1 gap-[20px] md:grid-cols-2 md:gap-[25px] lg:grid-cols-4 lg:gap-[25px] xl:grid-cols-5 xl:gap-[30px] mb-12 border-0">
          {isLoading ? (
            <p>Loading...</p>
          ) : error ? (
            <p>{error}</p>
          ) : data.length > 0 ? (
            data.map((product) => (
              <ProductCard data={product} key={product._id || product.id} />
            ))
          ) : (
            <p>No products available</p>
          )}
        </div>
      </div>
    </div>
  );
};

export default BestDeals;
