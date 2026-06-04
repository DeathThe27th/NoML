module no_mans_land::vault {
    use std::string::{Self, String};
    use sui::vec_map::{Self, VecMap};
    use sui::event;

    // ─── ERRORS ──────────────────────────────────────────────────────────────
    const ENotVaultOwner: u64 = 1;
    const ESupplyExceeded: u64 = 2;
    const EAlreadyMinted: u64 = 3;
    const ENotPaidPiece: u64 = 4;

    // ─── STRUCTS ─────────────────────────────────────────────────────────────

    /// One piece of research published to a vault
    public struct Piece has store, drop {
        id: u64,
        title: String,
        blob_id: String,       // Walrus blob ID
        is_paid: bool,
        price_mist: u64,       // price in MIST (1 SUI = 1_000_000_000 MIST)
        supply: u64,           // 0 = unlimited
        minted: u64,
        timestamp: u64,
    }

    /// An analyst's vault — one per wallet address
    public struct Vault has key, store {
        id: UID,
        owner: address,
        name: String,
        bio: String,
        pieces: VecMap<u64, Piece>,
        piece_count: u64,
    }

    /// Access NFT — proves a wallet paid for a specific piece
    public struct AccessNFT has key, store {
        id: UID,
        vault_owner: address,
        piece_id: u64,
        piece_title: String,
        blob_id: String,
        mint_number: u64,
    }

    /// Global registry — maps analyst address to their Vault object ID
    public struct Registry has key {
        id: UID,
        vault_count: u64,
    }

    // ─── EVENTS ──────────────────────────────────────────────────────────────

    public struct VaultCreated has copy, drop {
        vault_id: ID,
        owner: address,
        name: String,
    }

    public struct PiecePublished has copy, drop {
        vault_owner: address,
        piece_id: u64,
        blob_id: String,
        is_paid: bool,
    }

    public struct AccessMinted has copy, drop {
        nft_id: ID,
        buyer: address,
        vault_owner: address,
        piece_id: u64,
        mint_number: u64,
    }

    // ─── INIT ─────────────────────────────────────────────────────────────────

    fun init(ctx: &mut TxContext) {
        transfer::share_object(Registry {
            id: object::new(ctx),
            vault_count: 0,
        });
    }

    // ─── VAULT FUNCTIONS ─────────────────────────────────────────────────────

    /// Create a new vault for the caller
    public fun create_vault(
        registry: &mut Registry,
        name: vector<u8>,
        bio: vector<u8>,
        ctx: &mut TxContext,
    ) {
        let owner = tx_context::sender(ctx);
        let vault = Vault {
            id: object::new(ctx),
            owner,
            name: string::utf8(name),
            bio: string::utf8(bio),
            pieces: vec_map::empty(),
            piece_count: 0,
        };

        event::emit(VaultCreated {
            vault_id: object::id(&vault),
            owner,
            name: string::utf8(name),
        });

        registry.vault_count = registry.vault_count + 1;
        transfer::transfer(vault, owner);
    }

    /// Publish a piece to the caller's vault
    public fun publish_piece(
        vault: &mut Vault,
        title: vector<u8>,
        blob_id: vector<u8>,
        is_paid: bool,
        price_mist: u64,
        supply: u64,
        ctx: &mut TxContext,
    ) {
        assert!(vault.owner == tx_context::sender(ctx), ENotVaultOwner);

        let piece_id = vault.piece_count;
        let blob_id_str = string::utf8(blob_id);

        let piece = Piece {
            id: piece_id,
            title: string::utf8(title),
            blob_id: blob_id_str,
            is_paid,
            price_mist,
            supply,
            minted: 0,
            timestamp: tx_context::epoch(ctx),
        };

        event::emit(PiecePublished {
            vault_owner: vault.owner,
            piece_id,
            blob_id: string::utf8(blob_id),
            is_paid,
        });

        vec_map::insert(&mut vault.pieces, piece_id, piece);
        vault.piece_count = vault.piece_count + 1;
    }

    /// Mint access NFT for a paid piece
    public fun mint_access(
        vault: &mut Vault,
        piece_id: u64,
        payment: &mut sui::coin::Coin<sui::sui::SUI>,
        ctx: &mut TxContext,
    ) {
        let piece = vec_map::get_mut(&mut vault.pieces, &piece_id);

        assert!(piece.is_paid, ENotPaidPiece);
        assert!(piece.supply == 0 || piece.minted < piece.supply, ESupplyExceeded);

        // Take payment
        let paid = sui::coin::split(payment, piece.price_mist, ctx);
        transfer::public_transfer(paid, vault.owner);

        // Increment mint count
        piece.minted = piece.minted + 1;
        let mint_number = piece.minted;

        let nft = AccessNFT {
            id: object::new(ctx),
            vault_owner: vault.owner,
            piece_id,
            piece_title: piece.title,
            blob_id: piece.blob_id,
            mint_number,
        };

        event::emit(AccessMinted {
            nft_id: object::id(&nft),
            buyer: tx_context::sender(ctx),
            vault_owner: vault.owner,
            piece_id,
            mint_number,
        });

        transfer::transfer(nft, tx_context::sender(ctx));
    }

    // ─── READ FUNCTIONS ───────────────────────────────────────────────────────

    public fun vault_owner(vault: &Vault): address { vault.owner }
    public fun vault_piece_count(vault: &Vault): u64 { vault.piece_count }
    public fun registry_vault_count(registry: &Registry): u64 { registry.vault_count }

    public fun nft_blob_id(nft: &AccessNFT): &String { &nft.blob_id }
    public fun nft_piece_id(nft: &AccessNFT): u64 { nft.piece_id }
    public fun nft_vault_owner(nft: &AccessNFT): address { nft.vault_owner }
    public fun nft_mint_number(nft: &AccessNFT): u64 { nft.mint_number }
}
