const reviewForm = document.getElementById('review-inquiry');
const reviewStatus = document.getElementById('review-status');
function trackReview(name) {
  if (typeof window.gtag === 'function') window.gtag('event', name, {offer: 'architecture_review_5000'});
}
document.querySelectorAll('[data-review-email]').forEach(link => link.addEventListener('click', () => trackReview('review_email_opened')));
reviewForm.addEventListener('submit', event => {
  event.preventDefault();
  const data = new FormData(reviewForm);
  const subject = '$5,000 Architecture Review — fit call request';
  const body = [
    'Hello Chris,', '',
    'I would like to discuss the $5,000 Architecture Review for one application or integration landscape.', '',
    'Name: ' + data.get('name'),
    'Work email: ' + data.get('email'),
    'Company: ' + data.get('company'), '',
    'System and main challenge:', data.get('system'), '',
    'Project timing and preferred call times:', data.get('timing'), '',
    'Please reply to confirm a suitable introductory call time.'
  ].join('\n');
  document.getElementById('review-message').value = 'To: internetapps.net@gmail.com\nSubject: ' + subject + '\n\n' + body;
  document.getElementById('review-send').href = 'mailto:internetapps.net@gmail.com?subject=' + encodeURIComponent(subject) + '&body=' + encodeURIComponent(body);
  document.getElementById('review-draft').hidden = false;
  reviewStatus.textContent = 'Email draft ready. Review it, then open your email app or copy the draft and send it.';
  document.getElementById('review-message').focus();
  trackReview('review_inquiry_prepared');
});
document.getElementById('review-send').addEventListener('click', () => trackReview('review_email_opened'));
document.getElementById('review-copy').addEventListener('click', async () => {
  const message = document.getElementById('review-message');
  try {
    await navigator.clipboard.writeText(message.value);
    reviewStatus.textContent = 'Email draft copied. Paste it into your email service and send it to internetapps.net@gmail.com.';
  } catch {
    message.focus();
    message.select();
    reviewStatus.textContent = 'Select and copy the highlighted draft, then send it through your email service.';
  }
});
