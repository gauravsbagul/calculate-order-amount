const { SMALL_ORDER, MEDIUM_ORDER } = require('./constants/orderSizeOfPackaging')
const { TAKEAWAY } = require('./constants/orderTypes')

const getOrderAmountWithDiscount = (
  orderList,
  taxPercentage,
  isGstRegistered,
  orderType,
  restPackagingCharges,
  coupon,
  isCouponClaimed,
  petPoojaMenuMappingId,
  MAX_DISCOUNT_AMOUNT
) => {
  let taxAmount = isGstRegistered ? taxPercentage : 0
  let countTotalItems = 0
  let totalOrderAmount =
    orderList
      .map(item => {
        const price = item?.price || 0
        const quantity = item?.quantity || 0
        countTotalItems += quantity
        return price * quantity
      })
      .reduce((a, b) => a + b, 0) || 0

  let totalPayableAmount = totalOrderAmount
  let discountAmount = MAX_DISCOUNT_AMOUNT
  let totalDiscountAmountMax = 0
  let totalAmountWithDiscount = undefined
  let taxOnTotalAmount = 0

  if (!isCouponClaimed) {
    taxOnTotalAmount = totalOrderAmount * taxAmount
    totalPayableAmount = totalOrderAmount + taxOnTotalAmount
  } else if (coupon && isCouponClaimed) {
    const maximumDiscountValue = coupon.maximumDiscountValue
    const minimumOrderValue = coupon.minimumOrderValue
    const couponType = coupon.type
    const couponValue = coupon.value

    if (totalOrderAmount >= minimumOrderValue) {
      if (couponType === 'percentage') {
        discountAmount = Math.round((totalOrderAmount * couponValue) / 100)
        totalDiscountAmountMax =
          discountAmount >= maximumDiscountValue ? maximumDiscountValue : Math.round(discountAmount)
      } else if (couponType === 'fixed') {
        totalDiscountAmountMax = couponValue
      }
      totalAmountWithDiscount = totalOrderAmount - totalDiscountAmountMax
      taxOnTotalAmount = Math.round(totalAmountWithDiscount * taxAmount)
      totalPayableAmount = Math.round(totalAmountWithDiscount + taxOnTotalAmount)
    }
  }

  let packagingCharges
  if (orderType === TAKEAWAY) {
    if (restPackagingCharges && petPoojaMenuMappingId === 'NIL') {
      let size =
        countTotalItems <= SMALL_ORDER
          ? 'small'
          : countTotalItems > SMALL_ORDER && countTotalItems <= MEDIUM_ORDER
          ? 'medium'
          : 'large'
      packagingCharges = restPackagingCharges[size]
      totalPayableAmount += restPackagingCharges[size]
    } else if (petPoojaMenuMappingId !== 'NIL') {
      const packingChargesArray = []
      orderList.map(item => {
        if (Number(item.petPoojaMenuItem?.item_packingcharges)) {
          packingChargesArray.push(item.quantity * Number(item.petPoojaMenuItem?.item_packingcharges))
        }
      })
      packagingCharges = packingChargesArray.reduce((sum, item) => {
        const updatedSum = Number(sum || 0) + Number(item || 0)
        return updatedSum
      }, 0)
      totalPayableAmount += packagingCharges
    }
  }

  return {
    totalOrderAmount, // sum total of all product
    taxOnTotalAmount,
    totalPayableAmount,
    discountAmount,
    totalDiscountAmountMax,
    packagingCharges
  }
}

module.exports = getOrderAmountWithDiscount
