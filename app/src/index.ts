import * as anchor from "@coral-xyz/anchor";
import { Program } from "@coral-xyz/anchor";

import { createUmi } from "@metaplex-foundation/umi-bundle-defaults";
import { userKeypair } from "./helpers";
import {
  generateSigner,
  keypairIdentity,
  percentAmount,
} from "@metaplex-foundation/umi";

import { SolanaNftAnchor } from "../../target/types/solana_nft_anchor";
import { walletAdapterIdentity } from "@metaplex-foundation/umi-signer-wallet-adapters";
import {
  MPL_TOKEN_METADATA_PROGRAM_ID,
  findMasterEditionPda,
  findMetadataPda,
  mplTokenMetadata,
} from "@metaplex-foundation/mpl-token-metadata";
import {
  ASSOCIATED_TOKEN_PROGRAM_ID,
  TOKEN_PROGRAM_ID,
  getAssociatedTokenAddress,
} from "@solana/spl-token";
import { publicKey } from "@metaplex-foundation/umi";

// const provider = anchor.AnchorProvider.env();
// anchor.setProvider(provider);
const program = anchor.workspace.SolanaNftAnchor as Program<SolanaNftAnchor>;

// provider.wallet;

const umiClient = createUmi(anchor.web3.clusterApiUrl("devnet"));
const keypair = umiClient.eddsa.createKeypairFromSecretKey(
  userKeypair.secretKey
);
const signer = keypairIdentity(keypair);
umiClient.use(signer).use(mplTokenMetadata());

const metadata = {
  name: "Kobenim",
  symbol: "kBN",
  uri: "https://raw.githubusercontent.com/687c/solana-nft-native-client/main/metadata.json",
};
async function main() {
  // generate the mint account
  const mint = anchor.web3.Keypair.generate();

  // Derive the associated token address account for the mint
  const associatedTokenAccount = await getAssociatedTokenAddress(
    mint.publicKey,
    userKeypair.publicKey
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
      signer: userKeypair.publicKey,
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
}
