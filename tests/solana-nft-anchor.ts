import * as anchor from "@coral-xyz/anchor";
import { Program } from "@coral-xyz/anchor";
import { walletAdapterIdentity } from "@metaplex-foundation/umi-signer-wallet-adapters";
import {
  ASSOCIATED_TOKEN_PROGRAM_ID,
  TOKEN_PROGRAM_ID,
  getAssociatedTokenAddress,
} from "@solana/spl-token";
import {
  findMasterEditionPda,
  findMetadataPda,
  mplTokenMetadata,
  MPL_TOKEN_METADATA_PROGRAM_ID,
} from "@metaplex-foundation/mpl-token-metadata";
import { createUmi } from "@metaplex-foundation/umi-bundle-defaults";
import { publicKey } from "@metaplex-foundation/umi";

import { SolanaNftAnchor } from "../target/types/solana_nft_anchor";

describe("solana-nft-anchor", () => {
  // Configure the client to use the local cluster.
  const provider = anchor.AnchorProvider.env();
  anchor.setProvider(provider);

  const program = anchor.workspace.SolanaNftAnchor as Program<SolanaNftAnchor>;
  const signer = provider.wallet;
  const umiClient = createUmi(anchor.web3.clusterApiUrl("devnet"))
    .use(walletAdapterIdentity(signer))
    .use(mplTokenMetadata());

  const metadata = {
    name: "Kobenim",
    symbol: "kBN",
    uri: "https://raw.githubusercontent.com/687c/solana-nft-native-client/main/metadata.json",
  };

  it("Is initialized!", async () => {
    // Add your test here.
    const mint = anchor.web3.Keypair.generate();

    // Derive the associated token address account for the mint
    const associatedTokenAccount = await getAssociatedTokenAddress(
      mint.publicKey,
      signer.publicKey
    );

    // derive the metadata account
    let metadataAccount = findMetadataPda(umiClient, {
      mint: publicKey(mint.publicKey),
    })[0];

    //derive the master edition pda
    let masterEditionAccount = findMasterEditionPda(umiClient, {
      mint: publicKey(mint.publicKey),
    })[0];

    const tx = await program.methods
      .initNft(metadata.name, metadata.symbol, metadata.uri)
      .accounts({
        signer: provider.publicKey,
        mint: mint.publicKey,
        associatedTokenAccount,
        metadataAccount,
        masterEditionAccount,
        tokenProgram: TOKEN_PROGRAM_ID,
        associatedTokenProgram: ASSOCIATED_TOKEN_PROGRAM_ID,
        tokenMetadataProgram: MPL_TOKEN_METADATA_PROGRAM_ID,
        systemProgram: anchor.web3.SystemProgram.programId,
        rent: anchor.web3.SYSVAR_RENT_PUBKEY,
      })
      .signers([mint])
      .rpc();

    console.log(
      `mint nft tx: https://explorer.solana.com/tx/${tx}?cluster=devnet`
    );
    console.log(
      `minted nft: https://explorer.solana.com/address/${mint.publicKey}?cluster=devnet`
    );
  });
});
