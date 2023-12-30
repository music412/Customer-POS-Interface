from flask import Flask, request, jsonify
from flask_cors import CORS  # Import the CORS extension
from Order import Order
from datetime import datetime
import psycopg2

app = Flask(__name__)
CORS(app)

order = Order(None, None, None, None, None, None, None)

# Database connection setup
try:
    conn = psycopg2.connect(
        host='csce-315-db.engr.tamu.edu',
        database='csce315_905_01db',
        user='csce315_905_01user',
        password='M4thishard!'
    )
    print('Connection success')
except psycopg2.Error as e:
    print("Connection error:", e)

@app.route("/")
def homePage():
    order = Order(None, None, None, None, None, None, None)
    return "<h1>hello world</h1>"


@app.route("/getMenuItems")
def getMenuItems():
    try:
        with conn.cursor() as cur:
            query = "SELECT menuitem_name, menu_category, item_id, price_hot, price_iced FROM menu_item"
            cur.execute(query)
            result = cur.fetchall()

            menu = {}
            for row in result:
                currMap = {}
                currItem = row[0]
                currMap['category'] = row[1]
                currMap['id'] = row[2]
                currMap['price_hot'] = row[3]
                currMap['price_iced'] = row[4]
                menu[currItem] = currMap
            #print(menu)
            return jsonify(menu)
    except Exception as e:
        conn.rollback()  # Roll back the transaction in case of an exception
        app.logger.error(str(e))
        return jsonify({"error": "An error occurred while fetching menu items"}), 500

# grab the order number from the database and return it to the API
@app.route("/getOrderNum", methods=['GET','POST'])
def getOrderNum():
    with app.app_context():
        try:
            current_date = datetime.now()
            order_number = 0
            #use python instead
            formatted_date = current_date.strftime("%Y-%m-%d")
            print(formatted_date)
            with conn.cursor() as cur:
                query = "SELECT MAX(order_num) FROM orders WHERE order_date = %s"
                cur.execute(query, (formatted_date,))
                result = cur.fetchone()
                if result[0] is None:
                    order_number = 1
                else:
                    order_number = (result[0] + 1)
            return jsonify({"order_number": order_number}), 200
        except Exception as e:
            return jsonify({"message": str(e)}, 500)

@app.route("/createOrder", methods=['POST'])
def createOrder():
    with app.app_context():
        with conn.cursor() as cur:
            data = request.json
            order.order_date = data.get('date')
            order.order_num = data.get('num')
            order.order_time = data.get('time')
            order.status = "pending"
            order.order_items = []

            print(order)

            query = "INSERT INTO orders (order_num, order_date, order_time, status) VALUES (%s, %s, %s, %s)"
            cur.execute(query, (order.order_num, order.order_date, order.order_time, order.status))
            conn.commit()

        # You can add more logic to handle the order data here
        # Return a response to acknowledge the successful order creation
        return jsonify({"message": "Order created successfully"}), 200

@app.route("/setMenuItem", methods=['GET','POST'])
def setMenuItem():
    try:
        item_name = request.json.get('item_name')

        # Perform the database query using the provided item_name
        with conn.cursor() as cur:
            query = "SELECT item_id FROM menu_item WHERE menuitem_name = %s"
            cur.execute(query, (item_name,))
            result = cur.fetchone()

            query2 = "SELECT food_category FROM menu_item WHERE menuitem_name = %s"
            cur.execute(query2, (item_name,))
            result2 = cur.fetchone()

            if result:
                # ADDED CATEGORY SO THAT CAN FILTER THE BUTTONS THAT SHOW WHNE YOU CLICK AN ITEM #
                item_id = result[0]
                category = result2[0]
                newItem = {}
                newItem['itemName'] = item_name
                newItem['id'] = item_id
                newItem['category'] = category
                newItem['temp'] = True
                newItem['milk'] = -1
                newItem['itemQuantity'] = 0
                newItem['cost'] = 0
                order.order_items.append(newItem)
                print(order.order_items)
                return jsonify({"category": category})  # Return the updated order.order_items as JSON
            else:
                return jsonify({"message": "no result"})
    except Exception as e:
        return jsonify({"message": str(e)}, 500)

@app.route("/getOrderItemData")
def getOrderItemData():
    try: 
        return jsonify(order.order_items)
    except Exception as e:
        return jsonify({"message": str(e)}, 500)

@app.route("/setItemQuant", methods=['GET','POST'])
def setItemQuant():
    try:
        quantity = request.json.get('item_quant')
        name = request.json.get('item_name')
        index = request.json.get('index')
        print(order.order_items)
        order.order_items[index]['itemQuantity'] = quantity

        return jsonify(order.order_items)
    except Exception as e:
        return jsonify({"message": str(e)}, 500)
    
@app.route("/updateModifications", methods=['GET','POST'])
def updateModifications():
    try:
        mod= request.json.get('mods')
        name = request.json.get('itemName')
        index = request.json.get('index')
        # Find the last item in the orderData and update its quantity
        if mod == "Hot":
            order.order_items[index]['temp'] = True
        elif mod == "Iced":
            order.order_items[index]['temp'] = False
        elif mod == "2%":
            order.order_items[index]['milk'] = 1
        elif mod == "Whole":
            order.order_items[index]['milk'] = 2
        elif mod == "Almond":
            order.order_items[index]['milk'] = 3
        elif mod == "Breve":
            order.order_items[index]['milk'] = 4
        elif mod == "Oat":
            order.order_items[index]['milk'] = 5
        return jsonify(order.order_items)
    except Exception as e:
        return jsonify({"message": str(e)}, 500)
    
@app.route("/getTotalCost",  methods=['GET','POST'])
def getTotalCost():
    with conn.cursor() as cur:
        print(order.order_num)
        print(order.order_items)
        cost = 0
        items = []
        for o in order.order_items:
            print(o)
            itemCost = 0
            icedCost = 0
            hotCost = 0
            milkCost = 0
            print(o['id'])

            if o['temp'] == False:
                with conn.cursor() as cur:
                    query = "SELECT price_iced FROM menu_item WHERE item_id = %s"
                    cur.execute(query, (o['id'],))
                    result = cur.fetchone()
                    icedCost += result[0]
            if o['temp'] == True:
                with conn.cursor() as cur:
                    query = "SELECT price_hot FROM menu_item WHERE item_id = %s"
                    cur.execute(query, (o['id'],))
                    result = cur.fetchone()
                    hotCost += result[0]
            if o['milk'] != -1:
                with conn.cursor() as cur:
                    query = "SELECT price_hot FROM menu_item WHERE item_id = %s"
                    m = o['milk'] + 23
                    cur.execute(query, (m,))
                    result = cur.fetchone()
                    milkCost += result[0]
                    print("m")
                    print(milkCost)
            itemCost = (hotCost + icedCost + milkCost)*o['itemQuantity']
            o['cost'] = itemCost
            items.append(itemCost)
            cost += itemCost
            print(itemCost)
        order.total_cost = cost
    return jsonify({"cost":order.total_cost, "itemCosts":items})

@app.route("/setCustomer", methods=['GET','POST'])
def setCustomer():
    try:
        customer = request.json.get('customer')
        order.customer = customer
        return jsonify(order.customer)
    except Exception as e:
        return jsonify({"message": str(e)}, 500)
    
@app.route("/deleteItem", methods=['GET','POST'])
def deleteItem():
    try:
        index = request.json.get('index')
        # remove the item at this index in the order.order_items array
        deleted_item = order.order_items.pop(index)

        # You can return the deleted item if needed
        return jsonify({"message": "Item deleted", "deleted_item": deleted_item})
    except Exception as e:
        return jsonify({"message": str(e)}, 500)
    
@app.route("/updateStatus", methods=['POST'])
def updateStatus():
    date = request.json.get('date')
    num = request.json.get('num')
    status = "complete"
    
    with conn.cursor() as cur:
        query = "UPDATE orders SET status = %s WHERE order_date = %s AND order_num = %s"
        cur.execute(query, (status, date, num))
        conn.commit()
    
    return jsonify({"message": "Status updated"})

     
@app.route("/closeOrder", methods=['GET','POST'])
def closeOrder():
    try:
        num = request.json.get('num')
        time = request.json.get('time')
        date = request.json.get('date')
        cost = request.json.get('cost')
        cust = order.customer
        employee = 9
        receipt = False

        print(date)
        print(num)
        print(order.order_items)


        with conn.cursor() as cur:
            # Start a transaction
            # Insert into 'orders' table
            query = "UPDATE orders SET total_cost = %s, customer = %s, employee = %s, receipt = %s WHERE order_date = %s AND order_num = %s"
            cur.execute(query, (cost, cust, employee, receipt, date, num))
            conn.commit()
            for o in order.order_items:
                query1 = "SELECT max(order_item_num) FROM order_item"
                cur.execute(query1)
                result = cur.fetchone()
                orderItemNum = result[0] + 1

                id = o['id']
                temp = o['temp']
                milk = o['milk']
                quant = o['itemQuantity']
    
                query2 = "INSERT INTO order_item VALUES(%s, %s, %s, %s, %s, %s, %s)"
                cur.execute(query2, (orderItemNum, num, date, id, quant, milk, temp))
                conn.commit()
                
                query3 = 'SELECT ing_id, ing_quantity FROM item_ing WHERE item_id = {n}'.format(n=id)
                cur.execute(query3)
                result3 = cur.fetchall()

                for row in result3:
                    ing_id = row[0]
                    ing_quantity = row[1]

                    query4 = 'select current_stock from inventory_ing where ing_id = {n}'.format(n=ing_id)
                    cur.execute(query4)
                    result4 = cur.fetchone()
                    new_stock = result4[0] - ing_quantity*quant
 

                    query5 = 'update inventory_ing set current_stock = {n} where ing_id = {m}'.format(n=new_stock, m=ing_id )
                    cur.execute(query5)
                    conn.commit()
                order.order_items = []
            # Commit the transaction
        return jsonify({"message": "inserted into database"})
    except Exception as e:
        # Handle any exceptions that may occur, such as database errors
        # Roll back the transaction to avoid partial data changes
        conn.rollback()
        return jsonify({"error": str(e)})
    
@app.route("/getOrders", methods=['GET','POST'])
def getOrders():
    with app.app_context():
        try:
            startDate = request.json.get("startDate")
            endDate = request.json.get("endDate")

            # Wrap database operations in an application context
            with conn.cursor() as cur:
                query = "SELECT * FROM orders WHERE order_date BETWEEN %s AND %s ORDER BY order_date DESC, order_num;"
                cur.execute(query, (startDate, endDate))
                result = cur.fetchall()

                orders = []
                for row in result:
                    currMap = {}
                    currMap['num'] = row[0]
                    currMap['date'] = row[1].strftime("%Y-%m-%d")
                    currMap['time'] = row[2]
                    currMap['cost'] = row[3]
                    currMap['customer'] = row[4]
                    currMap['employee'] = row[5]
                    currMap['receipt'] = row[6]
                    currMap['status'] = row[7]
                    orders.append(currMap)

                return jsonify(orders)
        
        except Exception as e:
            return jsonify({"message": str(e)}, 500)
        
@app.route("/getOrderItems", methods=['POST'])
def getOrderItems():
    with conn.cursor() as cur:
        date = request.json.get("date")
        num = request.json.get("num")
        query = "select * from get_order_items_list(%s,%s)"
        cur.execute(query, (num, date,))
        result = cur.fetchall()

    

        order.order_items = []

        for row in result:
            newItem = {}

            query2 = "select menuitem_name, food_category from menu_item where item_id = %s"
            cur.execute(query2, (row[2],))
            result2 = cur.fetchall()

            newItem['itemName'] = result2[0][0]
            newItem['id'] = row[2]
            newItem['category'] = result2[0][1]
            newItem['temp'] = row[5]
            newItem['milk'] = row[4]
            newItem['itemQuantity'] = row[3]
            newItem['cost'] = 0

            if not is_duplicate(newItem, order.order_items):
                order.order_items.append(newItem)

        return jsonify({"orderItems": order.order_items})

@app.route("/deleteOrder", methods=['GET', 'POST'])
def deleteOrder():
    with conn.cursor() as cur:
        date = request.json.get("date")
        num = request.json.get("num")
        print(date)
        print(num)
        query = "DELETE FROM orders WHERE order_num = %s AND order_date = %s"
        cur.execute(query, (num, date,))
        conn.commit()
        return jsonify({"message": "order deleted"})

def is_duplicate(new_item, order_items):
    # Check if the new_item is a duplicate based on all keys
    for item in order_items:
        if all(new_item[key] == item[key] for key in new_item):
            return True
    return False

if __name__ == "__main__":
   app.run(host='0.0.0.0', port=8000)
   #app.run(debug=True)
