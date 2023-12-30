class Order:
    def __init__(self, order_num, order_date, order_time, total_cost, order_items, customer, status):
        self.order_num = order_num
        self.order_date = order_date
        self.order_time = order_time
        self.total_cost = total_cost
        self.order_items = order_items
        self.customer = customer
        self.status = status

