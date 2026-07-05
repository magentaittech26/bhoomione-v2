<?php

namespace App\Http\Controllers\Api\v1;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class LocationController extends Controller
{
    /**
     * GET /api/v1/location/states
     */
    public function states()
    {
        $states = DB::table('location_states')
            ->select('id', 'name', 'code', 'type', 'latitude', 'longitude', 'is_active')
            ->where('is_active', true)
            ->orderBy('name', 'asc')
            ->get();
            
        return response()->json($states);
    }

    /**
     * GET /api/v1/location/districts
     */
    public function districts(Request $request)
    {
        $stateId = $request->query('state_id');
        if (!$stateId) {
            return response()->json(['error' => 'state_id parameter is required.'], 400);
        }

        $districts = DB::table('location_districts')
            ->select('id', 'state_id', 'name', 'latitude', 'longitude', 'is_active')
            ->where('state_id', $stateId)
            ->where('is_active', true)
            ->orderBy('name', 'asc')
            ->get();

        return response()->json($districts);
    }

    /**
     * GET /api/v1/location/taluks
     */
    public function taluks(Request $request)
    {
        $districtId = $request->query('district_id');
        if (!$districtId) {
            return response()->json(['error' => 'district_id parameter is required.'], 400);
        }

        $taluks = DB::table('location_taluks')
            ->select('id', 'district_id', 'name', 'latitude', 'longitude', 'is_active')
            ->where('district_id', $districtId)
            ->where('is_active', true)
            ->orderBy('name', 'asc')
            ->get();

        return response()->json($taluks);
    }

    /**
     * GET /api/v1/location/cities
     */
    public function cities(Request $request)
    {
        $districtId = $request->query('district_id');
        if (!$districtId) {
            return response()->json(['error' => 'district_id parameter is required.'], 400);
        }

        $cities = DB::table('location_cities')
            ->select('id', 'district_id', 'name', 'latitude', 'longitude', 'is_active')
            ->where('district_id', $districtId)
            ->where('is_active', true)
            ->orderBy('name', 'asc')
            ->get();

        return response()->json($cities);
    }

    /**
     * GET /api/v1/location/villages
     */
    public function villages(Request $request)
    {
        $talukId = $request->query('taluk_id');
        if (!$talukId) {
            return response()->json(['error' => 'taluk_id parameter is required.'], 400);
        }

        $villages = DB::table('location_villages')
            ->select('id', 'taluk_id', 'name', 'latitude', 'longitude', 'is_active')
            ->where('taluk_id', $talukId)
            ->where('is_active', true)
            ->orderBy('name', 'asc')
            ->get();

        return response()->json($villages);
    }

    /**
     * GET /api/v1/location/pincodes
     */
    public function pincodes(Request $request)
    {
        $cityId = $request->query('city_id');
        $villageId = $request->query('village_id');

        $query = DB::table('location_pincodes')
            ->select('id', 'pincode', 'city_id', 'village_id', 'latitude', 'longitude', 'is_active')
            ->where('is_active', true);

        if ($cityId) {
            $query->where('city_id', $cityId);
        }
        
        if ($villageId) {
            $query->where('village_id', $villageId);
        }

        $pincodes = $query->orderBy('pincode', 'asc')->get();

        return response()->json($pincodes);
    }

    /**
     * GET /api/v1/location/search?q=
     */
    public function search(Request $request)
    {
        $q = $request->query('q');
        if (!$q || strlen($q) < 2) {
            return response()->json([]);
        }

        $results = [];

        // 1. Search Pincodes
        $pincodes = DB::table('location_pincodes')
            ->leftJoin('location_cities', 'location_pincodes.city_id', '=', 'location_cities.id')
            ->leftJoin('location_villages', 'location_pincodes.village_id', '=', 'location_villages.id')
            ->select(
                'location_pincodes.id as pincode_id',
                'location_pincodes.pincode',
                'location_cities.name as city_name',
                'location_villages.name as village_name'
            )
            ->where('location_pincodes.pincode', 'like', "%{$q}%")
            ->where('location_pincodes.is_active', true)
            ->limit(10)
            ->get();

        foreach ($pincodes as $p) {
            $context = '';
            if ($p->village_name) {
                $context .= $p->village_name;
            }
            if ($p->city_name) {
                $context .= ($context ? ', ' : '') . $p->city_name;
            }
            $results[] = [
                'type' => 'pincode',
                'id' => $p->pincode_id,
                'name' => $p->pincode,
                'subtitle' => $context ? "PIN Code in {$context}" : "PIN Code",
            ];
        }

        // 2. Search Villages
        $villages = DB::table('location_villages')
            ->join('location_taluks', 'location_villages.taluk_id', '=', 'location_taluks.id')
            ->join('location_districts', 'location_taluks.district_id', '=', 'location_districts.id')
            ->join('location_states', 'location_districts.state_id', '=', 'location_states.id')
            ->select(
                'location_villages.id as village_id',
                'location_villages.name as village_name',
                'location_taluks.name as taluk_name',
                'location_districts.name as district_name',
                'location_states.name as state_name'
            )
            ->where('location_villages.name', 'ilike', "%{$q}%")
            ->where('location_villages.is_active', true)
            ->limit(10)
            ->get();

        foreach ($villages as $v) {
            $results[] = [
                'type' => 'village',
                'id' => $v->village_id,
                'name' => $v->village_name,
                'subtitle' => "Village/Locality in {$v->taluk_name}, {$v->district_name}, {$v->state_name}",
            ];
        }

        // 3. Search Cities
        $cities = DB::table('location_cities')
            ->join('location_districts', 'location_cities.district_id', '=', 'location_districts.id')
            ->join('location_states', 'location_districts.state_id', '=', 'location_states.id')
            ->select(
                'location_cities.id as city_id',
                'location_cities.name as city_name',
                'location_districts.name as district_name',
                'location_states.name as state_name'
            )
            ->where('location_cities.name', 'ilike', "%{$q}%")
            ->where('location_cities.is_active', true)
            ->limit(10)
            ->get();

        foreach ($cities as $c) {
            $results[] = [
                'type' => 'city',
                'id' => $c->city_id,
                'name' => $c->city_name,
                'subtitle' => "City/Town in {$c->district_name}, {$c->state_name}",
            ];
        }

        // 4. Search Taluks
        $taluks = DB::table('location_taluks')
            ->join('location_districts', 'location_taluks.district_id', '=', 'location_districts.id')
            ->join('location_states', 'location_districts.state_id', '=', 'location_states.id')
            ->select(
                'location_taluks.id as taluk_id',
                'location_taluks.name as taluk_name',
                'location_districts.name as district_name',
                'location_states.name as state_name'
            )
            ->where('location_taluks.name', 'ilike', "%{$q}%")
            ->where('location_taluks.is_active', true)
            ->limit(5)
            ->get();

        foreach ($taluks as $t) {
            $results[] = [
                'type' => 'taluk',
                'id' => $t->taluk_id,
                'name' => $t->taluk_name,
                'subtitle' => "Taluk/Tehsil in {$t->district_name}, {$t->state_name}",
            ];
        }

        // 5. Search Districts
        $districts = DB::table('location_districts')
            ->join('location_states', 'location_districts.state_id', '=', 'location_states.id')
            ->select(
                'location_districts.id as district_id',
                'location_districts.name as district_name',
                'location_states.name as state_name'
            )
            ->where('location_districts.name', 'ilike', "%{$q}%")
            ->where('location_districts.is_active', true)
            ->limit(5)
            ->get();

        foreach ($districts as $d) {
            $results[] = [
                'type' => 'district',
                'id' => $d->district_id,
                'name' => $d->district_name,
                'subtitle' => "District in {$d->state_name}",
            ];
        }

        return response()->json($results);
    }
}
