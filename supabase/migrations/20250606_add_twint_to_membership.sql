-- Update bonus_cards payment_method constraint: replace bank_transfer with card, keep twint/cash/sumup/stripe
ALTER TABLE bonus_cards
DROP CONSTRAINT IF EXISTS bonus_cards_payment_method_check;

ALTER TABLE bonus_cards
ADD CONSTRAINT bonus_cards_payment_method_check
CHECK (payment_method IN ('card', 'twint', 'cash', 'sumup', 'stripe'));
