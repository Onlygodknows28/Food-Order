import { useContext, useActionState } from "react"
import CartContext from "../store/CartContext"
import Modal from "./UI/Modal"
import { currencyFormatter } from "../util/formatting"
import Input from "./UI/Input"
import UserProgressContext from "../store/UserProgressContent"
import Button from "../components/UI/Button"
import useHttp from "../hooks/useHttp"

const requestConfig = {
    method: 'POST',
    headers: {
        'Content-Type': 'application/json'
    }
}
export default function Checkout() {
    const cartCtx = useContext(CartContext)
    const userProgressCtx = useContext(UserProgressContext)

    const { data, error, sendRequest, clearData } = useHttp('http://localhost:3000/orders', requestConfig)

    const cartTotal = cartCtx.items.reduce(
        (totalPrice, item) => totalPrice + item.quantity * item.price
        , 0
    )

    function handleClose() {
        userProgressCtx.hideCart()
    }

    function handleFinish(){
        userProgressCtx.hideCheckout()
        cartCtx.clearCart()
        clearData()
    }

    async function checkoutAction(prevState,  fd) {
        const customerData = Object.fromEntries(fd.entries())
        
        await sendRequest(JSON.stringify({
            order: {
                items: cartCtx.items,
                customer: customerData
            }
        }))

    }

    const [formState, formAction, isSending] = useActionState(checkoutAction, null)

    let actions = (
        <>
            <Button type="button" textOnly onClick={handleClose}>Close</Button>
            <Button textOnly>Submit Order</Button>
        </>
    )

    if(isSending) {
        actions = <span> Sending order data... </span>
    }

    if(data && !error){
        return <Modal open={userProgressCtx.progress === "checkout"} onClose={handleFinish}>
            <h2>Success!</h2>
            <p> Your order was submitted successfully</p>
            <p>We will send you an email in a few minutes</p>

            <p className="modal-actions">
                <Button onClick={handleFinish}>Okay</Button>

            </p>
        </Modal>
    }

    return (
        <Modal open={userProgressCtx.progress === "checkout"} onClose={handleClose}>
            <form action={formAction}>
                <h2>Checkout</h2>
                <p>Total Amount: {currencyFormatter.format(cartTotal)}</p>

                <Input label="Full Name" type="text" id="name" />
                <Input label="Email Address" id="email" type="email" />
                <Input label="Street" type="text" id="street" />
                <div className="control-row">
                    <Input label="Postal Code" type="text" id="postal-code" />
                    <Input label="City" type="text" id="city" />
                </div>

                {error && <Error title="Failed to submit order" message={error}/>}

                <p className="modal-actions">{actions}</p>
            </form>
        </Modal>
    )
}