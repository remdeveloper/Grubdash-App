const path = require("path");
const orders = require(path.resolve("src/data/orders-data"));
const nextId = require("../utils/nextId");

function list(req, res, next) {
  res.json({ data: orders });
}

function isValidOrder(req, res, next) {
  const { data: { deliverTo, mobileNumber, status, dishes } = {} } = req.body;

  if (!deliverTo || deliverTo === "") {
    return next({
      status: 400,
      message: "Order must include a deliverTo",
    });
  }
  if (!mobileNumber || mobileNumber === "") {
    return next({
      status: 400,
      message: "Order must include a mobileNumber",
    });
  }
  if (!dishes) {
    return next({
      status: 400,
      message: "Order must include a dish",
    });
  }
  if (dishes.length < 1 || Array.isArray(dishes) === false) {
    return next({
      status: 400,
      message: "Order must include at least one dish",
    });
  }
  for (let i = 0; i < dishes.length; i++) {
    const quantity = dishes[i].quantity;

    if (!quantity || quantity <= 0 || typeof quantity !== "number") {
      return next({
        status: 400,
        message: `Dish ${i} must have a quantity that is an integer greater than 0`,
      });
    }
  }

  next();
}

function orderExists(req, res, next) {
  res.locals.foundOrder = orders.find(
    (order) => order.id === req.params.orderId
  );
  if (res.locals.foundOrder) {
    return next();
  } else {
    return next({
      status: 404,
    });
  }
}

function orderIdValid(req, res, next) {
  const { data: { id, status } = {} } = req.body;

  if (id) {
    if (req.params.orderId !== id) {
      return next({
        status: 400,
        message: `Order id does not match route id. Order: ${id}, Route: ${req.params.orderId}`,
      });
    }
  }
  if (!status || status.length === 0 || status === "invalid") {
    return next({
      status: 400,
      message:
        "Order must have a status of pending, preparing, out-for-delivery, delivered",
    });
  }

  next();
}

function create(req, res) {
  const { data: { deliverTo, mobileNumber, status, dishes } = {} } = req.body;

  const newOrder = {
    id: nextId(),
    deliverTo: deliverTo,
    mobileNumber: mobileNumber,
    status: status,
    dishes: dishes,
  };
  orders.push(newOrder);
  res.status(201).json({ data: newOrder });
}

function read(req, res) {
  res.locals.foundOrder = orders.find(
    (order) => order.id === req.params.orderId
  );

  res.json({ data: res.locals.foundOrder });
}

function update(req, res, next) {
  res.locals.foundOrder = orders.find(
    (order) => order.id === req.params.orderId
  );

  const { data: { deliverTo, mobileNumber, status, dishes } = {} } = req.body;

  res.locals.foundOrder.id = req.params.orderId;
  res.locals.foundOrder.deliverTo = deliverTo;
  res.locals.foundOrder.mobileNumber = mobileNumber;
  res.locals.foundOrder.status = status;
  res.locals.foundOrder.dishes = dishes;

  res.json({ data: res.locals.foundOrder });
}

function destroy(req, res, next) {
  const foundOrder = orders.find((order) => order.id === req.params.orderId);
  if (!foundOrder) {
    return next({
      status: 404,
      message: `Order ${req.params.orderId} does not exist.`,
    });
  } else if (foundOrder.status !== "pending") {
    return next({
      status: 400,
      message: "An order cannot be deleted unless it is pending",
    });
  } else {
    return next({
      status: 204,
    });
  }
}

module.exports = {
  list,
  create: [isValidOrder, create],
  read: [orderExists, read],
  update: [orderExists, orderIdValid, isValidOrder, update],
  delete: [destroy],
};
