import React, { useEffect, useState } from "react";
import { useSelector } from "react-redux";
import styles from "../../../styles/styles";
import ProductCard from "../ProductCard/ProductCard";

const BestDeals = () => {
  const [data, setData] = useState([]);
  const { allProducts, isLoading, error } = useSelector((state) => state.products);

  useEffect(() => {
    console.log("allProducts in BestDeals:", allProducts); // Debugging log
    if (allProducts.length > 0) {
      const sortedData = allProducts.sort((a, b) => b.sold_out - a.sold_out);
      const firstFive = sortedData.slice(0, 5);
      setData(firstFive);
    }
  }, [allProducts]);

  return (
    <div>
      <div className={`${styles.section}`}>
        <div className={`${styles.heading}`}>
          <h1>Best Deals</h1>
        </div>
        <div className="grid grid-cols-1 gap-[20px] md:grid-cols-2 md:gap-[25px] lg:grid-cols-4 lg:gap-[25px] xl:grid-cols-5 xl:gap-[30px] mb-12 border-0">
          {isLoading ? (
            <p>Loading...</p>
          ) : error ? (
            <p>{error}</p>
          ) : data.length !== 0 ? (
            data.map((product, index) => <ProductCard data={product} key={index} />)
          ) : (
            <p>No products available</p>
          )}
        </div>
      </div>
    </div>
  );
};

export default BestDeals;
