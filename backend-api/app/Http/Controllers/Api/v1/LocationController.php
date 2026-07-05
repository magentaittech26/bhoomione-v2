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
            ->select('id', 'name', 'code')
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
            ->select('id', 'state_id', 'name')
            ->where('state_id', $stateId)
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
            ->select('id', 'district_id', 'name')
            ->where('district_id', $districtId)
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
            ->select('id', 'district_id', 'name')
            ->where('district_id', $districtId)
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
            ->select('id', 'taluk_id', 'name')
            ->where('taluk_id', $talukId)
            ->orderBy('name', 'asc')
            ->get();

        return response()->json($villages);
    }
}
