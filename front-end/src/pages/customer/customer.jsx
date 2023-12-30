import React, { useState, useEffect } from "react";
import {  useNavigate, useLocation } from 'react-router-dom';
import { SlArrowLeft } from "react-icons/sl";

import "./customer.css";

export const Customer = () => {
  const [menuData, setMenuData] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState("All"); 
  const [orderDetails, setOrderDetails] = useState(null);
  const [orderData, setOrderData] = useState([]);
  const [showModifications, setShowModifications] = useState(false);
  const [showCategoryButtons, setShowCategoryButtons] = useState(true);
  const [showItemButtons, setShowItemButtons] = useState(false);
  const [showCheckoutButtons, setShowCheckoutButtons] = useState(false);
  const [selectedItem, setSelectedItem] = useState(null);
  const [quantity, setQuantity] = useState(1);
  const [addedItems, setAddedItems] = useState([]);
  const [orderIndex, setOrderIndex] = useState(0);
  const [showModal, setShowModal] = useState(false);
  const [orderComplete, setOrderComplete] = useState(false);
  const [selectedItemIndex, setSelectedItemIndex] = useState(null);
  const [zoomLevel, setZoomLevel] = useState(1);

  const location = useLocation();
  const navigate = useNavigate();

  // Check if there's an updated orderData in the location state
  const locationOrderData = location.state && location.state.orderData;

  // If there's an updated orderData in the state, use it; otherwise, use the local orderData
  const currentOrderData = locationOrderData || orderData;




  useEffect(() => {
    fetch("https://project3backend-8hqc.onrender.com/getMenuItems")
      .then((res) => res.json())
      .then((data) => {
        // Convert the object to an array of objects
        const menuArray = Object.entries(data).map(([itemName, itemDetails]) => ({
          name: itemName,
          ...itemDetails,
        }));
        setMenuData(menuArray);
      })
      .catch((error) => {
        console.error("Error: ", error);
      });
  }, []);

  useEffect(() => {
  if (location.state && location.state.orderData) {
      setOrderData(location.state.orderData);
  }
  }, [location.state]);
  
  // Log the updated orderData
  useEffect(() => {
  renderOrderItems()
  }, [orderData]);

  const createNewOrder = () => {
    // Create a new Date object to get the current date
    setOrderData([]);
    // setCustomer("");
    // setComment("");
    // setOrderComplete(false);
    const currentDate = new Date();
    let orderNumber = 0;
    // Extract year, month, and day components
    const year = currentDate.getFullYear();
    const month = (currentDate.getMonth() + 1).toString().padStart(2, '0');
    const day = currentDate.getDate().toString().padStart(2, '0');
  
    const cost = 0;
    // Format the date as "YYYY-MM-DD"
    const formattedDate = `${year}-${month}-${day}`;
  
    // Calculate current time in minutes
    const currentMinutes = currentDate.getHours() * 60 + currentDate.getMinutes();
  
    // Send a request to get the order number, and include the formattedDate in the request
    fetch("https://project3backend-8hqc.onrender.com/getOrderNum", {
      method: 'POST', // Depending on your server's API
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ formattedDate: formattedDate }),
    })
      .then((res) => res.json())
      .then((data) => {
        // Assuming the response contains the order number
        orderNumber = data.order_number;
        // Now you can use the order number and the formatted date as needed
        console.log("Order Number:", orderNumber);
        getTotalCost();
        // now call the create a new order function in python with the order number, date, etc
        fetch("https://project3backend-8hqc.onrender.com/createOrder", {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ date: formattedDate, num: orderNumber, time: currentMinutes }),
        })
          .then(response => {
            if (response.ok) {
              console.log("Order set successfully");
              // Set the order details in state after creating the order
              setOrderDetails({ orderNumber, formattedDate, currentMinutes, cost });
            } else {
              console.error("Error setting order");
            }
          });
      })
      .catch((error) => {
        console.error("Error:", error);
      });
  };

  const setMenuItem = (name, quantity) => {
    console.log(name)
    fetch("https://project3backend-8hqc.onrender.com/setMenuItem", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ item_name: name, item_quant: quantity}), // Convert the item data to a JSON string
    })
      .then((res) => res.text()) // Parse the response as text
      .then((data) => {
        // Parse the response data into an object
        console.log(data);
        console.log(data.category);
        let dataObject = eval(`(${data})`);
        console.log(dataObject.category);
          
        // let cat = newValues.category;
        // console.log(cat);
        // Update the orderData array with the new data
        setOrderData([...currentOrderData, { itemName: name, itemQuantity: quantity, milk:-1, temp:true, itemCost:0, category:dataObject.category}]);      
      })
      .catch((error) => {
        console.error("Error:", error);
      })  
  };
  
  const getOrderItemData = () => {
    fetch("https://project3backend-8hqc.onrender.com/getOrderItemData")
    .then((res) => res.json())
    .then((data) => {
      console.log(data);
    })
    .catch((error) => {
      console.error("Error:", error);
    }); 
  };
  const updateQuantity = (q, name) => {
    console.log(q);
    // setQuantUpdate(true);
    const itemIndex = selectedItem === null
    ? orderData.map(item => item.itemName).lastIndexOf(name)
    : orderData.findIndex(item => {
        const itemArray = [item.itemName, item.itemQuantity, item.milk, item.temp, item.category]; // Add other properties as needed
        return arraysEqual(itemArray, selectedItem);
      });

    const itemQuant = { item_quant: q, item_name: name, index: itemIndex};
    fetch("https://project3backend-8hqc.onrender.com/setItemQuant", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(itemQuant),
    })
      .then((res) => res.json())
      .then((data) => {
        // Find the index of the last item in orderData with the matching name
        // if it's already in there, change the quantity otherwise append it
        if (orderData.length > 0 && selectedItem == null) {
          const lastItem = orderData[orderData.length - 1];
  
          if (lastItem.itemName === name) {
            // If the last item has the same name, update its quantity
            const updatedOrderData = [...orderData];
            updatedOrderData[updatedOrderData.length - 1].itemQuantity = q;
            setOrderData(updatedOrderData);
          } 
          else {
            // If the last item is not the same, append a new item
            const newItem = { itemName: name, itemQuantity: q };
            setOrderData([...orderData, newItem]);
          }
        } 
        else {
          const updatedOrderData = orderData.map((item) => {
            if (item.itemName === selectedItem[0]) {
              item.itemQuantity = q;
            }
            return item;
          });
          
          setOrderData(updatedOrderData);
        }
      })
      .catch((error) => {
        console.error("Error updating quantity:", error);
      });
  };
    
  const getMilkType = (milkValue) => {
    switch (milkValue) {
      case 1:
      return "2% Milk";
      case 2:
      return "Whole Milk";
      case 3:
      return "Almond Milk";
      case 4:
      return "Breve";
      case 5:
      return "Oat Milk";
      default:
      return "Unknown";
    };
  };

  const handleItemClick = (item) => {
    const itemArray = [item.itemName, item.itemQuantity, item.milk, item.temp, item.category]; // Add other properties as needed

    // Set selectedItem to itemArray
    setSelectedItem(itemArray);
    const itemIndex = orderData.findIndex((orderItem) => arraysEqual(itemArray, [orderItem.itemName, orderItem.itemQuantity, orderItem.milk, orderItem.temp, orderItem.category]));
    setSelectedItemIndex(itemIndex);
  
    console.log(itemArray);
  };

  // Function to check if two arrays are equal
  const arraysEqual = (array1, array2) => {
    if (array1 === array2) return true;
    if (array1 == null || array2 == null) return false;
    if (array1.length !== array2.length) return false;

    for (let i = 0; i < array1.length; ++i) {
      if (array1[i] !== array2[i]) return false;
    }

    return true;
  };
  
  const deleteSelectedItem = (itemName) => {
    if (selectedItem !== null) {
      const itemIndex = orderData.findIndex((item) => {
          const itemArray = [item.itemName, item.itemQuantity, item.milk, item.temp, item.category];
          return arraysEqual(itemArray, selectedItem);
      });

      if (itemIndex !== -1) {
        fetch("https://project3backend-8hqc.onrender.com/deleteItem", {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
            },
            body: JSON.stringify({ index: itemIndex }),
        })
            .then((res) => res.json())
            .then((data) => {
                const updatedOrderData = orderData.filter((item) => {
                    const itemArray = [item.itemName, item.itemQuantity, item.milk, item.temp, item.category];
                    return !arraysEqual(itemArray, selectedItem);
                });
                setOrderData(updatedOrderData);
                setSelectedItem(null); // Set selectedItem to null after deleting
                setSelectedItemIndex(null); // Set selectedItemIndex also to null to prevent the selected color from showing up again after the first time
            })
            .catch((error) => {
                console.error("Error deleting item:", error);
            });
      }
    }
  };

  useEffect(() => {
    console.log(orderData);
    getTotalCost();
  }, [orderData]); 

  const handleCategoryClick = (category) => {
    setSelectedCategory(category); 
    setShowModifications(false);
    setShowCategoryButtons(false);
  };

  const handleBackButtonClick = () => {
    setShowItemButtons(false);
    setShowCategoryButtons(true);
  };
  const handleBackButtonClickMod = () => {
    if (showModifications) {
        // If on the modifications page, go back to the items page
        setShowItemButtons(true);
        setShowCategoryButtons(false);
        setShowModifications(false);
      } else {
        setShowItemButtons(false);
        setShowCategoryButtons(false);
        setShowModifications(true);
      }
  };
    
  const renderOrderItems = (itemName, quantity) => {
    if (!itemName) {
      return null;
    }
  
    return (
      <div className="image-item-container-sp">
        {orderData.map((item, index) => {
          let isSelected = false;
          const itemArray = [item.itemName, item.itemQuantity, item.milk, item.temp, item.category]; // Add other properties as needed
          if (selectedItem !== null && arraysEqual(selectedItem, itemArray)) {
            console.log(selectedItem);
            isSelected = true;
          }
          const menuItem = menuData.find((menuItem) => menuItem.name === item.itemName);
          const itemCategory = menuItem?.category;
          const hotPrice = menuItem?.price_hot;
          const icePrice = menuItem?.price_iced;
  
          return (
            <div key={index} onClick={() => handleItemClick(item)}
            className={`order-item-select ${selectedItemIndex === index ? "selected" : ""} ${
              index === orderData.length - 1 ? "recently-added" : ""
            }`}
            >
              <div className="order-details3">
                <img src={getItemDetails(item.itemName).imageURL} alt={`${item.itemName} Image`} className="piccheckout-image" />
                <div className="checkout-info">
                  <div className="checkout-title">
                    <p className="item-name">{item.itemName}</p>
                    <div className="quantity">
                      <span>&emsp;Quantity: {item.itemQuantity}</span>
                    </div>
                    <div className="modifications-container">
                      <div className="modifications-cust">
                        {console.log("Item Category:", itemCategory)}
                        {(itemCategory === 'Coffee' || itemCategory === 'Drinks') && (
                          <span>&emsp; Temp: {item.temp ? "Hot" : "Iced"}</span>
                        )}
                      </div>
                      <div className="modifications-cust">
                        {item.milk !== -1 && (
                          <>
                            {console.log("Milk: ", item.milk)}
                            <span>&emsp;{getMilkType(item.milk)}</span>
                            <br />
                          </>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
                <div className="price-container">
                  {item.milk === 4 || item.milk === 5 ? (
                    <>
                      {console.log("HOT: ", hotPrice)}
                      {item.temp === true ? (
                        <span>&emsp;$ {(hotPrice + 1.0) * item.itemQuantity}</span>
                      ) : (
                        <span>&emsp;$ {(icePrice + 1.0) * item.itemQuantity}</span>
                      )}
                    </>
                  ) : item.milk === 3 ? (
                    <>
                      {console.log("HOT: ", hotPrice)}
                      {console.log("QUANTITY: ", item.itemQuantity)}
                      {item.temp === true ? (
                        <span>&emsp;$ {(hotPrice + 0.5) * item.itemQuantity}</span>
                      ) : (
                        <span>&emsp;$ {(icePrice + 0.5) * item.itemQuantity}</span>
                      )}
                    </>
                  ) : (
                    <>
                      {console.log("HOT: ", hotPrice)}
                      {item.temp === true ? (
                        <span>&emsp;$ {hotPrice * item.itemQuantity}</span>
                      ) : (
                        <span>&emsp;$ {icePrice * item.itemQuantity}</span>
                      )}
                    </>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    );
  };
    
  const handleModClick = (item) => {     
    setShowModifications(true); // Show modification buttons
    setShowItemButtons(false);
    setShowCategoryButtons(false); // Hide category buttons
  };

  const handleIncrease = () => {
    setQuantity((prevQuantity) => prevQuantity + 1);
  };

  const handleDecrease = () => {
    if (quantity > 1) {
        setQuantity((prevQuantity) => prevQuantity - 1);
    }
  };
  const getItemDetails = (itemType) => {
    let  description, imageURL;
  
    switch (itemType) {
      case 'Mocha':
        description = 'Dutch-cocoa and cane sugar create a rich, creamy marriage of coffee & chocolate.';
        imageURL = "https://img.freepik.com/premium-photo/white-mug-mocha-coffee-isolated-white-background-file-contains-with-clipping-path-so-easy-work_24076-673.jpg";
        break;
      case 'Butterscotch':
        description = 'Nutty, deep sugar sweetness with a silky finish. ';
        imageURL = "https://d3gg7p8kl1yfy0.cloudfront.net/detail-smoked-butterscotch-latte_2022.jpg" 
        break;
      case 'Drip Coffee':
        description = 'Traditional filter-brewed coffee';
        imageURL = "https://media.istockphoto.com/id/507191815/photo/coffee.jpg?s=612x612&w=0&k=20&c=CINjq2UwQGDkN3XoJZsT9WcNaSA6lILxGB1cunKJ4nU=" ;
        break;
      case 'Au Lait':
        description = 'Brewed coffee and steamed milk, one part coffee to one part steamed milk.';
        imageURL = "https://images.delightedcooking.com/slideshow-mobile-small/cup-of-coffee.jpg" ;
        break;
      case 'Espresso':
        description = 'Brewed at high pressure and temperature, espresso delivers a rich expression of coffee with a syrupy mouthfeel.';
        imageURL = "https://media.istockphoto.com/id/545335342/photo/coffee-espresso-in-white-background.jpg?s=612x612&w=0&k=20&c=DfjvwtXe7md6aeFwfZzI-rDX0ByfRJmHFUCEctJfFw8=" ;
        break;
      case 'Americano':
        description = 'A rich, full-bodied cup of coffee. Two shots of espresso and water.';
        imageURL = "https://t4.ftcdn.net/jpg/01/20/47/47/360_F_120474760_EaU0gxlvYKoPIybpA8zffG6p4XxcEeZJ.jpg" ;
        break;
      case 'Cortado':
        description = 'A balanced Spanish-style cappuccino, equal parts milk and espresso, served at 100º.';
        imageURL = "https://img.freepik.com/premium-photo/glass-coffee-isolated-white-background_787273-1169.jpg" ;
        break;
      case 'Cappuccino':
        description = 'A cup of silky textured milk and espresso, Somewhere in the happy land between espresso and a latte.';
        imageURL = "https://img.freepik.com/premium-photo/hot-coffee-cappuccino-with-foam-white-background_33725-33.jpg";
        break;
      case 'Harvest':
        description = 'Our gourmet vanilla latte and signature drink. Made with hand-dressed vanilla beans and raw sugar.';
        imageURL = "https://media.istockphoto.com/id/1176745305/photo/vanilla-latte-and-milk-foam-isolated-on-white-background.jpg?s=170667a&w=0&k=20&c=PmqB7dkqteCjiNdqS0fo9QDD-kCKpg-MNTutnz8njas=" ;
        break;
      case 'Latte':
        description = 'The sweetness of milk enhances the subtleties of espresso.';
        imageURL = "https://img.freepik.com/premium-photo/hot-coffee-cappuccino-latte-art-isolated-white-background_158502-315.jpg" ;
        break;
      case 'London Fog':
        description = 'Earl Grey (Black Tea).';
        imageURL = "https://img.freepik.com/premium-photo/cup-tea-isolated-white-background_126277-525.jpg" ;
        break;
      case 'Iced Tea':
        description = 'Organic house blend black unsweet iced tea.';
        imageURL = "https://t4.ftcdn.net/jpg/02/92/02/01/360_F_292020124_gQoIZIuHo9TqSILqq2gqXsfwhGvsknPG.jpg" ;
        break;
      case 'Hot Chocolate':
        description = 'Rich Dutched cocoa, cane sugar, and textured milk develop a very rich cup.';
        imageURL = "https://food.fnr.sndimg.com/content/dam/images/food/fullset/2015/11/20/0/FNM_120115-Classic-Hot-Chocolate-Recipe_s4x3.jpg.rend.hgtvcom.406.305.suffix/1448037763419.jpeg" ;
        break;
      case 'Chai Latte':
        description = 'A lightly spiced blend of tea and cinnamon, cardamom, and pepper.';
        imageURL = "https://media.istockphoto.com/id/1292778356/vector/chai-latte.jpg?s=612x612&w=0&k=20&c=KspHVaSm9ZrPSrsISzTEl5xSsD9_tjy9xzHNHZqA298=";
        break;
      case 'Cinnamon Rolls':
        description = 'We make these by hand, from scratch, in generous sizes for you to enjoy!';
        imageURL = "https://t4.ftcdn.net/jpg/00/34/93/79/360_F_34937907_BsCqXQJyLj6IZLAHc2zAWnqi6o7ctTlu.jpg";
        break;
      case 'Almond Danish':
        description = 'Almond: Flaky pastry filled with honey almond cream cheese.';
        imageURL = "https://fayda.com/wp-content/uploads/2016/04/BD053.jpg";
        break;
      case 'Eco Bar':
        description = 'Ecobar. This amazing bar is packed full of dried fruits, pumpkin seeds, and cacao and is sweetened with agave. Paleo, vegan, and gluten-free.';
        imageURL = "https://img.freepik.com/premium-photo/granola-bar-with-nuts-dried-fruits-isolated-white-background-high-quality-photo_311158-5475.jpg" ;
        break;
      case 'Blueberry Oat Bread':
        description = 'We make this from scratch in our kitchen with plump blueberries and rolled oats.';
        imageURL = "https://thelemonbowl.com/wp-content/uploads/2020/07/Sliced-Blueberry-Oatmeal-Bread-SP.jpg" ;
        break;
      case 'Bacon Sandwich':
        description = 'Roasted turkey, crisp bacon & avocado, with swiss, lettuce, and tomato on wheat bread.';
        imageURL = "https://media.istockphoto.com/id/137450936/photo/blt-sandwich-isolated-on-white.jpg?s=612x612&w=0&k=20&c=jfKiZnBkQ3eJ9ZdB2W0KFbLJsp_8NKQcMUMCv3gVsS0=";
        break;
      case 'Avocado Toast':
        description = 'Hand-dressed avocado, olive oil, lemon.';
        imageURL = "https://img.freepik.com/premium-photo/delicious-toast-with-avocado-isolated-white-background_185193-27477.jpg";
        break;
      case 'Caprese Toast':
        description = 'basil, tomato and mozzarella';
        imageURL = "https://images.squarespace-cdn.com/content/v1/5b5b8e0fe17ba3db50e5b3ea/1599104383984-4J0DGQA3ZNN9TNEL4LMA/36.jpg" ;
        break;
      case 'Chicken Pesto':
        description = 'Our own superfood pesto made with basil, arugula, and kale over fresh-cooked chicken, tomatoes, balsamic glaze and mozzarella on wheat. (Pesto contains nuts).';
        imageURL = "https://olo-images-live.imgix.net/b6/b6d9fa3f76684c9483fa7955d1034746.jpg?auto=format%2Ccompress&q=60&cs=tinysrgb&w=528&h=352&fit=fill&fm=png32&bg=transparent&s=3961946723f777d034f84de7df44291e" ;
        break;
      case 'Chicken Salad':
        description = 'A lighter version of one of our favorites. With herbed yogurt mayo, apples, and walnuts on honey wheat. (Chicken salad contains nuts).';
        imageURL = "https://img.freepik.com/premium-photo/chicken-salad-sandwich-isolated-white-background-3d-rendering_890887-7073.jpg" ;
        break;
      default:
        description = "NEW ITEM";
        imageURL = "https://static.vecteezy.com/system/resources/thumbnails/032/980/212/small/new-item-rubber-grunge-stamp-seal-vector.jpg";
        break;
      }
    
      return { description, imageURL };
  };

  const renderModifications = (itemName, quantity, handleIncrease, handleDecrease, description) => {
    const itemDetails = getItemDetails(itemName);
    const itemCategory = menuData.find(item => item.name === itemName)?.category;
    const menuItem = menuData.find(item => item.name === itemName);
    const hotPrice = menuItem ? menuItem.price_hot : null;

    if (itemCategory === 'Coffee' || itemCategory === 'Drinks') {
      const icePrice = menuItem ? menuItem.price_iced : null;
      return (
        <div className="image-item-container">
          <div className="item-content">
            <img src={itemDetails.imageURL} alt={`${itemName} Image`} className="mod-image" />
            <div className="text-sizes">
              {itemName}
              <br /> 
              <div className="description">{itemDetails.description}</div>
            </div>
          </div>
          <div className="title-section">
            <h3>Hot/Iced</h3>
          </div>
          <div className = "container-hot">
            <button className={clickedHotIcedModifications.Hot ? "box clicked" : "box"} onClick={() => updateHotIcedModifications("Hot", itemName)}>
              <div className = "box-text">
                Hot
                <br /> 
                {hotPrice && <span>Price: $ {hotPrice}</span>}
              </div>
            </button>
            <button className={clickedHotIcedModifications.Iced ? "box clicked" : "box"} onClick={() => updateHotIcedModifications("Iced", itemName)}>
              <div className = "box-text">
                Iced
                <br /> 
                {icePrice && <span>Price: $ {icePrice}</span>}
              </div>
            </button>
          </div>
          <div className="milk-section">
              <h2>Milk</h2>
          </div>
          <div className = "container-milk">            
            <button className={clickedMilkModifications.Whole ? "box2 clicked" : "box2"} onClick={() => updateMilkModifications("Whole", itemName)}>
              <div className="box-text" >
                Whole
                <br />
                +$0
              </div>
            </button>
            <button className={clickedMilkModifications['2%'] ? "box clicked" : "box"} onClick={() => updateMilkModifications("2%", itemName)}>
              <div className="box-text" >
                2%
                <br />
                +$0
              </div>
            </button>
            <button className={clickedMilkModifications.Almond ? "box2 clicked" : "box2"} onClick={() => updateMilkModifications("Almond", itemName)}>
              <div className="box-text" >
                Almond
                <br />
                +$0.50
              </div>
            </button>
            <button className={clickedMilkModifications.Breve ? "box2 clicked" : "box2"} onClick={() => updateMilkModifications("Breve", itemName)}>
              <div className="box-text" >
                Breve
                <br />
                +$1
              </div>
            </button>
            <button className={clickedMilkModifications.Oat ? "box clicked" : "box"} onClick={() => updateMilkModifications("Oat", itemName)}>    
              <div className="box-text" >
                Oat
                <br />
                +$1
              </div>
            </button>
            <div className="line-between"></div>
            <div className="quantity-container2">
            <Quantity
              quantity={quantity}
              Increase={() => {
                handleIncrease();
                updateQuantity(quantity + 1, itemName);
              }}
              Decrease={() => {
                if (quantity > 0) {
                  handleDecrease();
                  updateQuantity(quantity - 1, itemName);
                }
              }}
            />
          </div>
        </div>
      </div>
      );
    } else {
        // No modifications when the category is not 'Coffee' or 'Drinks'
        return (
          <div className="image-item-container">
            <div className="item-content">
                <img src={itemDetails.imageURL} alt={`${itemName} Image`} className="mod-image" />
                <div className="text-sizes">
                    {itemName}
                    <br />
                    <div className="description">{itemDetails.description}</div>
                    <div className = "price-text">
                    {hotPrice && <span>Price: $ {hotPrice}</span>}
                    </div>
                </div>
              </div>
              <div className="line-between2"></div>
              <Quantity
                quantity={quantity}
                Increase={() => {
                
                    handleIncrease();
                    updateQuantity(quantity + 1, itemName);
                  }}
                  Decrease={() => {
                    if (quantity > 0) {
                      handleDecrease();
                      updateQuantity(quantity - 1, itemName);
                    }
                }}
              />   
          </div>
        );
      }
    };

  const handleAddOrderClick = () => {
    setShowModifications(false);
    setShowCategoryButtons(false);
    setShowItemButtons(false);
    setShowCheckoutButtons(true);
    setSelectedCategory(false);
    const item = orderData[orderData.length - 1];
    console.log(item.itemName)
    getTotalCost();
  };
    
  const handleAddMoreItemsClick = (itemName) => {
    setShowModifications(false);
    setShowCategoryButtons(true);
    setShowItemButtons(false);
    setShowCheckoutButtons(false);
    setSelectedCategory(false);
    setClickedHotIcedModifications({});
    setClickedMilkModifications({});
    // setClickedModifications({});
    setOrderIndex(0); // Reset orderIndex to 0
    // Put all items in orderData into addedItems
    setAddedItems((prevItems) => [...prevItems, ...orderData]);
    };
          
  const getTotalCost = async () => {
    console.log(orderData);
    fetch("https://project3backend-8hqc.onrender.com/getTotalCost")
      .then((res) => res.json())
      .then((data) => {
        console.log(data);
        
        setOrderDetails((prevOrderDetails) => ({
          ...prevOrderDetails,
          cost: data.cost,
        }));

        // Assuming orderData is an array of items

        const updatedOrderData = orderData.map((item, index) => {
          item.itemCost = data.itemCosts[index];
          return item;
        });
      })
      .catch((error) => {
        console.error("Error: ", error);
      });

  };

  const Modal = ({ onClose }) => (
    <div className="modal">
      <div className="modal-content">
        <p>Successfully placed your order!</p>
        <button onClick={onClose}>Close</button>
      </div>
    </div>
  );

  const handleQuantityChange = (quantity) => {
      if (selectedItem === null) {
          const lastItem = orderData[orderData.length - 1];
          updateQuantity(quantity, lastItem.itemName);
          console.log(lastItem.itemName);
          console.log(lastItem.category);
          console.log(orderData);
      } else {
        updateQuantity(quantity, selectedItem);
      }
  };

  const Quantity = ({ quantity, Increase, Decrease }) => {
      return (
        <div className="quantity-container">
            <button className="quantity-button" onClick={Decrease}>-</button>
            <div className="quantity-display">{quantity}</div>
            <button className="quantity-button" onClick={Increase}>+</button>  
        </div>
      );
  };

  const closeOrder = (orderDetails) => {
    fetch("https://project3backend-8hqc.onrender.com/closeOrder", {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          date: orderDetails.formattedDate,
          time: orderDetails.currentMinutes,
          num: orderDetails.orderNumber,
          cost: orderDetails.cost
        }),
      })
      .then((res) => res.json())
      .then((data) => {
        console.log(data);
        setShowModal(true);
      })
      fetch("https://project3backend-8hqc.onrender.com/updateStatus", {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          date: orderDetails.formattedDate,
          num: orderDetails.orderNumber
        }),
      })
      .then((res) => res.json())
      .then((data) => {
        console.log(data);
      })
      setOrderComplete(true);
  };

  const closeModal = () => {
      // Close the modal
    setShowModal(false);
    setOrderData([]);
    // If the order data is empty, set the total cost to 0
    setOrderDetails((prevOrderDetails) => ({
        ...prevOrderDetails,
        cost: 0,
    }));
    //navigate('/customer');
    // go back to the category page
    setShowModifications(false);
    setShowCategoryButtons(true);
    setShowItemButtons(false);
    setShowCheckoutButtons(false);
    setSelectedCategory(false);
    setClickedHotIcedModifications({});
    setClickedMilkModifications({});
  };

  const [clickedHotIcedModifications, setClickedHotIcedModifications] = useState({
      Hot: false,
      Iced: false,
  });
    
  const [clickedMilkModifications, setClickedMilkModifications] = useState({
    '2%': false,
    Whole: false,
    Almond: false,
    Breve: false,
    Oat: false,
  });

  // Function to update Hot/Iced modifications
  const updateHotIcedModifications = (mod,name) => {
    setClickedHotIcedModifications((prevClickedModifications) => {
      const newClickedModifications = { ...prevClickedModifications };
      Object.keys(newClickedModifications).forEach((type) => {
        newClickedModifications[type] = false;
      });
      newClickedModifications[mod] = true;

      const itemIndex = selectedItem === null
      ? orderData.map(item => item.itemName).lastIndexOf(name)
      : orderData.findIndex(item => {
          const itemArray = [item.itemName, item.itemQuantity, item.milk, item.temp, item.category]; // Add other properties as needed
          return arraysEqual(itemArray, selectedItem);
        });

      fetch("https://project3backend-8hqc.onrender.com/updateModifications", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ mods: mod , itemName: name, index: itemIndex}), 
      })
      .then((res) => res.json())
      .then((data) => {
        if (orderData.length > 0 && selectedItem == null)  {
          const lastItem = orderData[orderData.length - 1];
          const updatedOrderData = [...currentOrderData];

          if (mod === "Iced") {
            updatedOrderData[orderData.length - 1].temp = false;
          }
          if (mod == "Hot") {
            updatedOrderData[orderData.length - 1].temp = true;
          }
          setOrderData(updatedOrderData);
        } else {
          const updatedOrderData = orderData.map((item, index) => {
            const itemArray2 = [item.itemName, item.itemQuantity, item.milk, item.temp, item.category]; 
            if (arraysEqual(itemArray2, selectedItem)) {
              console.log(item);
              if (mod === "Iced") {
                  item.temp = false;
                }
                if (mod === "Hot") {
                  item.temp = true;
                }
            }
            return item;
          });
          setOrderData(updatedOrderData);
          console.log(orderData);
        }
        })
      .catch((error) => {
        console.error("Error updating quantity:", error);
      });
    return newClickedModifications;
    });
  };

// Function to update Milk modifications
const updateMilkModifications = (mod,name) => {
  setClickedMilkModifications((prevClickedModifications) => {
    const newClickedModifications = { ...prevClickedModifications };
    Object.keys(newClickedModifications).forEach((type) => {
      newClickedModifications[type] = false;
    });
    newClickedModifications[mod] = true;

    const itemIndex = selectedItem === null
    ? orderData.map(item => item.itemName).lastIndexOf(name)
    : orderData.findIndex(item => {
        const itemArray = [item.itemName, item.itemQuantity, item.milk, item.temp, item.category]; // Add other properties as needed
        return arraysEqual(itemArray, selectedItem);
      });

    fetch("https://project3backend-8hqc.onrender.com/updateModifications", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ mods: mod , itemName: name, index: itemIndex}), 
    })
    .then((res) => res.json())
    .then((data) => {
        if (orderData.length > 0 && selectedItem == null) {
          const lastItem = orderData[orderData.length - 1];
          const updatedOrderData = [...currentOrderData];

          if (mod === "2%") {
            updatedOrderData[orderData.length - 1].milk = 1;
          }
          if(mod === "Whole"){
            updatedOrderData[orderData.length - 1].milk = 2;
          }
          if(mod === "Almond"){
            updatedOrderData[orderData.length - 1].milk = 3;
          }
          if(mod === "Breve"){
            updatedOrderData[orderData.length - 1].milk = 4;
          }
          if(mod === "Oat"){
            updatedOrderData[orderData.length - 1].milk = 5;
          }
        
          setOrderData(updatedOrderData);

        } else {
          const updatedOrderData = orderData.map((item, index) => {
            const itemArray2 = [item.itemName, item.itemQuantity, item.milk, item.temp, item.category]; 
            if (arraysEqual(itemArray2, selectedItem)) {
              console.log(item);
              if (mod === "2%") {
                item.milk = 1;
              }
              if (mod === "Whole") {
                item.milk = 2;
              }
              if (mod === "Almond") {
                item.milk = 3;
              }
              if (mod === "Breve") {
                item.milk = 4;
              }
              if (mod === "Oat") {
                item.milk = 5;
              }
            }
            return item;
          });
          setOrderData(updatedOrderData);
          console.log(orderData);
        }
      })
      .catch((error) => {
        console.error("Error updating quantity:", error);
      });
        return newClickedModifications;
      });
    };

    const getCategoryDetails = (categoryType) => {
      let imageURL;
      switch (categoryType) {
        case 'Coffee':
          imageURL = "https://idsb.tmgrup.com.tr/2015/05/01/GenelBuyuk/1430505593158_rs.jpg";
          break;
        case 'Drinks':
          imageURL = "https://t4.ftcdn.net/jpg/00/79/04/83/360_F_79048378_YJOAv3LnKzFffaAGBggQKehc74dFeRW3.jpg";
          break;
        case 'Pastries':
          imageURL = "https://t4.ftcdn.net/jpg/00/34/93/79/360_F_34937907_BsCqXQJyLj6IZLAHc2zAWnqi6o7ctTlu.jpg";
          break;
        case 'Breakfast':
          imageURL = "https://img.freepik.com/premium-photo/delicious-toast-with-avocado-isolated-white-background_185193-27477.jpg";
          break;
        default:
          imageURL = "https://media.istockphoto.com/id/1313445315/video/set-new-label-on-white-background-motion-graphics.jpg?s=640x640&k=20&c=2whUP4MdrgLtf9vY8LGqh8c_ULgKHm-evgCqHty38ss=";
          break;
      }
      return { imageURL };
    };

    const categories = [...new Set(menuData.map(item => item.category))];
    const filteredMenu = selectedCategory === ""
      ? menuData
      : menuData.filter(item => item.category === selectedCategory);
    
      return (
          <div className="Customer">
            {showCategoryButtons && (
                <div className="MenuTitle">
                  <h1>Full Menu</h1>
                  <div className="new-order">
                    <button onClick={() => createNewOrder()}>New Order</button>
                  </div>
                </div>
            )}
            <div className="Categories">
              {!showModifications && showCategoryButtons && !showItemButtons &&(
                <div className="Categories">
                  {categories.slice(1).map((category, index) => {
                    const { imageURL } = getCategoryDetails(category.categoryType);
                    return (
                      <button key={index} className="boxcust" onClick={() => handleCategoryClick(category)}>
                        <img src={getCategoryDetails(category).imageURL} alt={`${category.categoryType} Image`} className="boxcust-image" />
                        <span className="boxcust-text">{category}</span>
                      </button>
                    );
                  })}
                </div>
              )}
            </div>
              <div className = "Items">
                {!showModifications && !showCategoryButtons && (
                  filteredMenu.map((item, index) => {
                  const { imageURL } = getItemDetails(item.itemType);
                  return (
                    <button key = {index} className = "item-button" onClick={() => { 
                      setMenuItem(item.name, 0);  
                      handleModClick(item); // Call the handleModClick function
                    }}
                    >
                      <img src={getItemDetails(item.name).imageURL} alt={`${item.itemType} Image`} className="item-image" />
                      <span className="boxcust-text">{item.name}</span>
                    </button>
                  );
                  })
                )}
                <div className="Back">
                  {!showModifications && !showCategoryButtons && !showCheckoutButtons && (
                    <div className="back-button2" onClick={() => handleBackButtonClick()}>
                      <SlArrowLeft size={65}/> 
                    </div>
                  )}
                </div>
              </div>
              <div className="Modifications">
                {showModifications && !showCategoryButtons && !showItemButtons && orderData.length > 0 && renderModifications(orderData[orderData.length - 1].itemName, orderData[orderData.length - 1].itemQuantity, handleIncrease, handleDecrease)}
                {showModifications && (
                  <div className="line-between"></div>
                )}
                {showModifications && !showItemButtons && (
                  <div>
                    <button className="checkout-button-cust" onClick={handleAddOrderClick}>
                      <div className="checkout-text">
                        Add to Order
                      </div>
                    </button>
                    <div className = "Back2">
                      {showModifications && !showItemButtons && !showCheckoutButtons && !showCategoryButtons && (
                        <div className="back-button2" onClick={() => handleBackButtonClickMod()}>
                          <SlArrowLeft size={65}/> 
                        </div>
                      )}
                    </div>
                </div>
                )}
              </div>
              {showCheckoutButtons && !showModifications && !showCategoryButtons && !showItemButtons && (
                <div className="piccheckout-content">
                  {orderData.map((order, index) => (
                    <div key={index} className={`order-details2 ${index === orderIndex ? 'current-order' : ''}`}>
                      {index === orderIndex && (
                        <>
                          {renderOrderItems(order.itemName, order.quantity)}
                            <div className="close-Button">
                              {showModal && <Modal onClose={closeModal} />}
                            </div>
                        </>
                      )}
                    </div>
                  ))}
                </div>
              )}
            {showCheckoutButtons && !showModifications && !showCategoryButtons && !showItemButtons && (
              <>
                <div className="cost-and-checkout">
                    <div className = "cost-text-cust">Total Cost: $ {orderDetails.cost}</div>
                    <div className="button-row">
                    <button className="checkout-add-more-items" onClick={() => handleAddMoreItemsClick(orderDetails.itemName)}>
                      Add More Items
                    </button>
                    <button className="deleteButton" onClick={() => deleteSelectedItem(orderDetails.itemName)}>
                      Delete Selected Item
                    </button>
                    <button className="checkout-close-button" onClick={() => closeOrder(orderDetails)}>Checkout</button>
                  </div>
                </div>
              </>
            )}
          </div>
        );
};
export default Customer;
