-- Add 'twint' back to bonus_cards payment_method check constraint
ALTER TABLE bonus_cards
DROP CONSTRAINT IF EXISTS bonus_cards_payment_method_check;

ALTER TABLE bonus_cards
ADD CONSTRAINT bonus_cards_payment_method_check
CHECK (payment_method IN ('twint', 'bank_transfer', 'sepa', 'cash', 'sumup'));
