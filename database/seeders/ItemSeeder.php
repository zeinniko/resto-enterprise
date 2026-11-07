<?php

namespace Database\Seeders;

use App\Models\Category;
use App\Models\Item;
use App\Models\Unit;
use Illuminate\Database\Seeder;

class ItemSeeder extends Seeder
{
    public function run(): void
    {
        // 1. Ambil Map ID Kategori berdasarkan Tipe
        $categories = Category::pluck('id', 'name');
        $units = Unit::pluck('id', 'symbol');

        // Pastikan Kategori & Unit dasar sudah ada
        $catRaw      = $categories['Daging & Unggas'] ?? Category::where('type', 'raw_material')->first()?->id ?? 1;
        $catProduce  = $categories['Sayuran Segar'] ?? $catRaw;
        $catSeasoning= $categories['Saus & Marinasi Racikan'] ?? Category::where('type', 'semi_finished')->first()?->id ?? 1;
        $catDairy    = $categories['Produk Olahan Susu (Dairy)'] ?? $catRaw;
        $catPack     = $categories['Box Takeaway & Paper Cup'] ?? Category::where('type', 'packaging')->first()?->id ?? 1;

        $unitKg   = $units['Kg'] ?? 1;
        $unitG    = $units['g'] ?? 2;
        $unitL    = $units['L'] ?? 3;
        $unitMl   = $units['ml'] ?? 4;
        $unitPcs  = $units['pcs'] ?? 5;
        $unitPack = $units['pack'] ?? 6;
        $unitCtn  = $units['ctn'] ?? 7;

        $items = [
            // ==========================================
            // A. DAGING & PROTEIN (Bahan Baku Utama)
            // ==========================================
            [
                'sku' => 'RAW-BEEF-01',
                'name' => 'Daging Sapi Slice Shortplate (Fat)',
                'category_id' => $catRaw,
                'primary_unit_id' => $unitG,
                'purchase_unit_id' => $unitKg,
                'shelf_life_days' => 30,
                'is_active' => true,
            ],
            [
                'sku' => 'RAW-CHICK-01',
                'name' => 'Daging Ayam Fillet Dada (Boneless)',
                'category_id' => $catRaw,
                'primary_unit_id' => $unitG,
                'purchase_unit_id' => $unitKg,
                'shelf_life_days' => 14,
                'is_active' => true,
            ],
            [
                'sku' => 'RAW-EGG-01',
                'name' => 'Telur Ayam Negeri',
                'category_id' => $catRaw,
                'primary_unit_id' => $unitPcs,
                'purchase_unit_id' => $unitKg,
                'shelf_life_days' => 14,
                'is_active' => true,
            ],

            // ==========================================
            // B. SAYURAN & INGREDIENT SEGAR
            // ==========================================
            [
                'sku' => 'VEG-ONION-01',
                'name' => 'Bawang Bombay Segar',
                'category_id' => $catProduce,
                'primary_unit_id' => $unitG,
                'purchase_unit_id' => $unitKg,
                'shelf_life_days' => 7,
                'is_active' => true,
            ],
            [
                'sku' => 'VEG-GARLIC-01',
                'name' => 'Bawang Putih Kating Cincang',
                'category_id' => $catProduce,
                'primary_unit_id' => $unitG,
                'purchase_unit_id' => $unitKg,
                'shelf_life_days' => 7,
                'is_active' => true,
            ],
            [
                'sku' => 'VEG-CHILI-01',
                'name' => 'Cabai Rawit Merah Segar',
                'category_id' => $catProduce,
                'primary_unit_id' => $unitG,
                'purchase_unit_id' => $unitKg,
                'shelf_life_days' => 5,
                'is_active' => true,
            ],

            // ==========================================
            // C. BUMBU, SAUS, & OLAHAN SETENGAH JADI
            // ==========================================
            [
                'sku' => 'CND-TERIYAKI-01',
                'name' => 'Saus Teriyaki Base (Racikan)',
                'category_id' => $catSeasoning,
                'primary_unit_id' => $unitMl,
                'purchase_unit_id' => $unitL,
                'shelf_life_days' => 30,
                'is_active' => true,
            ],
            [
                'sku' => 'CND-OIL-01',
                'name' => 'Minyak Goreng Kelapa Sawit',
                'category_id' => $catSeasoning,
                'primary_unit_id' => $unitMl,
                'purchase_unit_id' => $unitL,
                'shelf_life_days' => 180,
                'is_active' => true,
            ],
            [
                'sku' => 'CND-CHEESE-01',
                'name' => 'Keju Mozzarella Parut (Topping Extra)',
                'category_id' => $catSeasoning,
                'primary_unit_id' => $unitG,
                'purchase_unit_id' => $unitKg,
                'shelf_life_days' => 30,
                'is_active' => true,
            ],

            // ==========================================
            // D. DAIRY, BAR & BEVERAGE INGREDIENTS
            // ==========================================
            [
                'sku' => 'BEV-MILK-01',
                'name' => 'Fresh Milk Plain Full Cream',
                'category_id' => $catDairy,
                'primary_unit_id' => $unitMl,
                'purchase_unit_id' => $unitL,
                'shelf_life_days' => 10,
                'is_active' => true,
            ],
            [
                'sku' => 'BEV-BEANS-01',
                'name' => 'Bijian Kopi Espresso Blend (Arabica/Robusta)',
                'category_id' => $catDairy,
                'primary_unit_id' => $unitG,
                'purchase_unit_id' => $unitKg,
                'shelf_life_days' => 90,
                'is_active' => true,
            ],
            [
                'sku' => 'BEV-SYRUP-PALM',
                'name' => 'Sirup Gula Aren Cair',
                'category_id' => $catDairy,
                'primary_unit_id' => $unitMl,
                'purchase_unit_id' => $unitL,
                'shelf_life_days' => 60,
                'is_active' => true,
            ],

            // ==========================================
            // E. PACKAGING & KEMASAN TAKEAWAY
            // ==========================================
            [
                'sku' => 'PKG-BENTO-01',
                'name' => 'Paper Rice Bowl 800ml + Tutup',
                'category_id' => $catPack,
                'primary_unit_id' => $unitPcs,
                'purchase_unit_id' => $unitPack,
                'shelf_life_days' => 0,
                'is_active' => true,
            ],
            [
                'sku' => 'PKG-CUP-16OZ',
                'name' => 'Plastic Cup Injection 16oz + Lid Dome',
                'category_id' => $catPack,
                'primary_unit_id' => $unitPcs,
                'purchase_unit_id' => $unitPack,
                'shelf_life_days' => 0,
                'is_active' => true,
            ],
        ];

        foreach ($items as $itemData) {
            Item::updateOrCreate(['sku' => $itemData['sku']], $itemData);
        }
    }
}