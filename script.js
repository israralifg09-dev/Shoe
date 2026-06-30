// Initialize EmailJS - replace with your actual EmailJS credentials
emailjs.init("YOUR_PUBLIC_KEY");

const EMAILJS_SERVICE_ID = "YOUR_SERVICE_ID";
const EMAILJS_TEMPLATE_ID = "YOUR_TEMPLATE_ID";
const OWNER_EMAIL = "israralifg09@gmail.com";

let cart = JSON.parse(localStorage.getItem('cart') || '[]');

async function sendOrderEmail(orderData){
	try{
		const itemsList = orderData.items.map(item => `${item.title} (Size: ${item.size}, Qty: ${item.qty}, $${item.price})`).join('\n');
		const emailParams = {
			to_email: OWNER_EMAIL,
			customer_name: orderData.name,
			customer_email: orderData.email,
			customer_phone: orderData.phone,
			customer_address: orderData.address,
			customer_area: orderData.area,
			customer_country: orderData.country,
			customer_postal: orderData.postal,
			items: itemsList,
			total_amount: `$${orderData.total.toFixed(2)}`,
			order_date: new Date().toLocaleString()
		};
		const response = await emailjs.send(EMAILJS_SERVICE_ID, EMAILJS_TEMPLATE_ID, emailParams);
		console.log('Order email sent successfully', response);
		return true;
	}catch(error){
		console.error('Failed to send order email', error);
		return false;
	}
}

function getCart(){ return cart; }
function saveCart(){ localStorage.setItem('cart', JSON.stringify(cart)); updateCartUI(); }

function updateCartUI(){
	// update count and render items
	const count = cart.reduce((s,i)=>s + (i.qty||0), 0);
	const el = document.getElementById('cart-count'); if(el) el.textContent = count;
	renderCart();
}

function showToast(message){
	const toast = document.getElementById('toast');
	if(!toast) return;
	toast.textContent = message;
	toast.classList.add('show');
	setTimeout(()=> toast.classList.remove('show'), 1800);
}

function addCart(e){
	const btn = e.currentTarget;
	const card = btn.closest ? btn.closest('.card') : null;
	const title = (btn.dataset && btn.dataset.title) || (card && card.dataset.title) || document.getElementById('modal-title')?.textContent || 'Item';
	const priceStr = (card && card.dataset.price) || document.getElementById('modal-price')?.textContent || '$0';
	const price = Number(String(priceStr).replace(/[^0-9.]/g,'')) || 0;
	const sizeEl = card ? card.querySelector('.size-select') : null;
	const size = sizeEl ? sizeEl.value : '';

	// try to find existing item by title+size
	const existing = cart.find(i=>i.title===title && i.size===size);
	if(existing){ existing.qty = (existing.qty||0) + 1; }
	else { cart.push({id: Date.now(), title, price, size, qty: 1}); }
	saveCart();
	showToast(`${title} added`);
}

function renderCart(){
	const container = document.getElementById('cart-items');
	if(!container) return;
	container.innerHTML = '';
	if(cart.length === 0){ container.innerHTML = '<p class="empty">Your cart is empty.</p>'; document.getElementById('cart-total').textContent = '$0.00'; return; }
	let total = 0;
	cart.forEach(item=>{
		total += (item.price||0) * (item.qty||0);
		const row = document.createElement('div'); row.className = 'cart-item';
		row.innerHTML = `<div class="ci-left"><div class="ci-title">${item.title}</div><div class="ci-size">${item.size ? 'Size: '+item.size : ''}</div></div><div class="ci-right"><div class="ci-qty"><button class="qty-decrease" data-id="${item.id}">−</button><span class="qty">${item.qty}</span><button class="qty-increase" data-id="${item.id}">+</button></div><div class="ci-price">$${((item.price||0)*item.qty).toFixed(2)}</div><button class="remove-item" data-id="${item.id}" aria-label="Remove">Remove</button></div>`;
		container.appendChild(row);
	});
	document.getElementById('cart-total').textContent = `$${total.toFixed(2)}`;

	// attach qty and remove handlers
	container.querySelectorAll('.qty-increase').forEach(b=> b.addEventListener('click', (e)=>{ const id=Number(e.currentTarget.dataset.id); const it=cart.find(i=>i.id===id); if(it){ it.qty++; saveCart(); }}));
	container.querySelectorAll('.qty-decrease').forEach(b=> b.addEventListener('click', (e)=>{ const id=Number(e.currentTarget.dataset.id); const it=cart.find(i=>i.id===id); if(it){ it.qty = Math.max(1, it.qty-1); saveCart(); }}));
	container.querySelectorAll('.remove-item').forEach(b=> b.addEventListener('click', (e)=>{ const id=Number(e.currentTarget.dataset.id); cart = cart.filter(i=>i.id!==id); saveCart(); }));
}

function openCart(){ const drawer = document.getElementById('cart-drawer'); if(!drawer) return; drawer.classList.add('open'); drawer.setAttribute('aria-hidden','false'); }
function closeCart(){ const drawer = document.getElementById('cart-drawer'); if(!drawer) return; drawer.classList.remove('open'); drawer.setAttribute('aria-hidden','true'); }

function openCheckout(){ 
	if(cart.length === 0){ showToast('Your cart is empty'); return; }
	const modal = document.getElementById('checkout-modal'); if(!modal) return;
	const total = cart.reduce((sum, item)=> sum + ((item.price||0) * (item.qty||0)), 0);
	document.getElementById('checkout-total').textContent = `$${total.toFixed(2)}`;
	modal.classList.add('open'); modal.setAttribute('aria-hidden','false');
}
function closeCheckout(){ const modal = document.getElementById('checkout-modal'); if(!modal) return; modal.classList.remove('open'); modal.setAttribute('aria-hidden','true'); }

document.addEventListener('DOMContentLoaded', ()=>{
	// wire add-to-cart buttons
	document.querySelectorAll('.add-to-cart').forEach(btn => btn.addEventListener('click', addCart));

	// view details buttons
	document.querySelectorAll('.view-details').forEach(btn => btn.addEventListener('click', (e)=>{ const card = e.currentTarget.closest('.card'); openModal(card); }));

	// modal handlers
	const modal = document.getElementById('modal');
	if(modal){
		modal.addEventListener('click', (e)=>{ if(e.target === modal) closeModal(); });
		const closeBtn = modal.querySelector('.modal-close'); if(closeBtn) closeBtn.addEventListener('click', closeModal);
		document.addEventListener('keydown', (e)=>{ if(e.key === 'Escape') closeModal(); });
		const modalAdd = document.getElementById('modal-add');
		if(modalAdd) modalAdd.addEventListener('click', addCart);
	}

	// cart open/close
	const cartBtn = document.getElementById('cart-button'); if(cartBtn){ cartBtn.addEventListener('click', openCart); cartBtn.addEventListener('keydown', (e)=>{ if(e.key==='Enter' || e.key===' ') openCart(); }); }
	const cartClose = document.querySelector('.cart-close'); if(cartClose) cartClose.addEventListener('click', closeCart);
	document.getElementById('clear-cart')?.addEventListener('click', ()=>{ cart = []; saveCart(); });
	document.getElementById('checkout')?.addEventListener('click', openCheckout);

	// checkout modal handlers
	const checkoutModal = document.getElementById('checkout-modal');
	if(checkoutModal){
		checkoutModal.addEventListener('click', (e)=>{ if(e.target === checkoutModal) closeCheckout(); });
		const closeBtn = checkoutModal.querySelector('.modal-close'); if(closeBtn) closeBtn.addEventListener('click', closeCheckout);
		document.getElementById('checkout-cancel')?.addEventListener('click', closeCheckout);
		document.addEventListener('keydown', (e)=>{ if(e.key === 'Escape') closeCheckout(); });
	}

	// checkout form submission
	const checkoutForm = document.getElementById('checkout-form');
	if(checkoutForm){
		checkoutForm.addEventListener('submit', async (evt)=>{
			evt.preventDefault();
			const name = document.getElementById('checkout-name').value.trim();
			const email = document.getElementById('checkout-email').value.trim();
			const phone = document.getElementById('checkout-phone').value.trim();
			const address = document.getElementById('checkout-address').value.trim();
			const area = document.getElementById('checkout-area').value.trim();
			const country = document.getElementById('checkout-country').value.trim();
			if(!name || !email || !phone || !address || !area || !country){ showToast('Please fill all required fields'); return; }
			const emailOk = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
			if(!emailOk){ showToast('Enter a valid email'); return; }
			const phoneOk = /^\d{7,}$/.test(phone.replace(/[\s\-\(\)]/g,''));
			if(!phoneOk){ showToast('Enter a valid phone number'); return; }
			const orders = JSON.parse(localStorage.getItem('orders') || '[]');
			const total = cart.reduce((sum, item)=> sum + ((item.price||0) * (item.qty||0)), 0);
			const orderData = {name, email, phone, address, area, country, postal: document.getElementById('checkout-postal').value.trim(), items: cart, total, date: new Date().toISOString()};
			orders.push(orderData);
			localStorage.setItem('orders', JSON.stringify(orders));
			
			// Send email notification to admin
			await sendOrderEmail(orderData);
			
			showToast('Order placed successfully! Thank you for your purchase.');
			cart = [];
			saveCart();
			checkoutForm.reset();
			closeCheckout();
		});
	}

	// Contact form handling
	const contactForm = document.getElementById('contact-form');
	if(contactForm){
		contactForm.addEventListener('submit', (evt)=>{
			evt.preventDefault();
			const name = document.getElementById('name').value.trim();
			const email = document.getElementById('email').value.trim();
			const message = document.getElementById('message').value.trim();
			if(!name || !email || !message){ showToast('Please fill all fields'); return; }
			const emailOk = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
			if(!emailOk){ showToast('Enter a valid email'); return; }
			const msgs = JSON.parse(localStorage.getItem('messages') || '[]');
			msgs.push({name, email, message, date: new Date().toISOString()});
			localStorage.setItem('messages', JSON.stringify(msgs));
			contactForm.reset();
			showToast('Message sent — thank you');
		});
	}

	// initial render
	updateCartUI();
});

// modal open/close helpers reused by code above
function openModal(card){
	const modal = document.getElementById('modal'); if(!modal || !card) return;
	const title = card.dataset.title || '';
	const price = card.dataset.price || '';
	const desc = card.dataset.desc || '';
	const img = card.dataset.img || '';
	document.getElementById('modal-title').textContent = title;
	document.getElementById('modal-price').textContent = price;
	document.getElementById('modal-desc').textContent = desc;
	const modalImg = document.getElementById('modal-img'); modalImg.src = img; modalImg.alt = title;
	const modalAdd = document.getElementById('modal-add'); if(modalAdd) modalAdd.dataset.title = title;
	modal.classList.add('open'); modal.setAttribute('aria-hidden', 'false');
}

function closeModal(){ const modal = document.getElementById('modal'); if(!modal) return; modal.classList.remove('open'); modal.setAttribute('aria-hidden', 'true'); }